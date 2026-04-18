
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Session, Routine, Exercise } from '../types';
import { logger } from '../utils/logger';
import { credentialsStore } from '../utils/credentialsStore';

class SyncService {
    private client: SupabaseClient | null = null;
    private isSyncing = false;
    private currentUrl: string = '';

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.sync();
            });
        }
    }

    private async retryOperation<T>(operation: () => PromiseLike<T>, retries = 3, delay = 1000): Promise<T> {
        try {
            return await operation();
        } catch (error: any) {
            if (retries <= 0) throw error;

            // Don't retry auth errors or if table completely missing (though we want to error if missing now)
            if (error?.code === 'PGRST204' || error?.message?.includes('does not exist')) {
                throw error;
            }

            logger.info('SyncService', `Retry in ${delay}ms (${retries} left)`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.retryOperation(operation, retries - 1, delay * 2);
        }
    }

    private getClient() {
        const supabaseUrl = credentialsStore.getSupabaseUrl() || useWorkoutStore.getState().userStats.supabaseUrl;
        const supabaseKey = credentialsStore.getSupabaseKey() || useWorkoutStore.getState().userStats.supabaseKey;
        if (!supabaseUrl || !supabaseKey) return null;

        if (!this.client || this.currentUrl !== supabaseUrl) {
            try {
                this.client = createClient(supabaseUrl, supabaseKey, {
                    auth: { persistSession: true },
                    global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(15000) }) }
                });
                this.currentUrl = supabaseUrl;
            } catch (e) {
                logger.error('SyncService', 'Invalid Supabase configuration', e);
                return null;
            }
        }
        return this.client;
    }

    public async validateConnection(url: string, key: string): Promise<boolean> {
        try {
            const tempClient = createClient(url, key, { auth: { persistSession: false } });
            // Check connection by querying profiles or just a simple health check
            // We use 'profiles' as it should exist if schema is applied
            const { error }: any = await tempClient.from('profiles').select('id').limit(1);

            if (error) {
                // If table doesn't exist, it's still a valid connection to Supabase, just missing schema
                if (error.code === 'PGRST116' || error.message?.includes('does not exist')) return true;
                // Auth error or network error
                logger.warn('SyncService', 'Connection validation failed', error.message);
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    private async getUserId(client: SupabaseClient): Promise<string | null> {
        const { data: { user } } = await client.auth.getUser();
        return user?.id || null;
    }

    /**
     * PULL: Fetch data from Cloud (Last Write Wins via Store Merge)
     */
    private async pull(client: SupabaseClient) {
        try {
            const userId = await this.getUserId(client);
            if (!userId) return; // Must be authenticated

            const [sessionData, routineData, exerciseData] = await Promise.all([
                this.retryOperation(() => client.from('sessions').select('json_data').eq('user_id', userId) as unknown as Promise<any>),
                this.retryOperation(() => client.from('routines').select('json_data').eq('user_id', userId) as unknown as Promise<any>),
                this.retryOperation(() => client.from('exercises').select('json_data').eq('user_id', userId) as unknown as Promise<any>),
            ]);

            const remoteSessions = (sessionData.data || []).map((row: any) => row.json_data);
            const remoteRoutines = (routineData.data || []).map((row: any) => row.json_data);
            const remoteExercises = (exerciseData.data || []).map((row: any) => row.json_data);
            // Need to handle folders merging in store, but currently store might not support it in mergeRemoteData?
            // createSessionSlice.ts showed mergeRemoteData taking 3 args.
            // We'll stick to 3 for now to match store signature.

            if (remoteSessions.length > 0 || remoteRoutines.length > 0 || remoteExercises.length > 0) {
                useWorkoutStore.getState().mergeRemoteData(remoteSessions, remoteRoutines, remoteExercises);
            }

        } catch (e) {
            logger.error('SyncService', 'Pull failed', e);
        }
    }

    /**
     * PUSH: Upload local changes (Delta Sync)
     */
    private async push(client: SupabaseClient) {
        const { history, routines, exercises, markSessionsSynced, markRoutinesSynced } = useWorkoutStore.getState();
        const userId = await this.getUserId(client);

        if (!userId) {
            logger.warn('SyncService', 'Cannot push — no authenticated user');
            return;
        }

        // 1. Sessions
        const pendingSessions = history.filter(s => !s._synced);
        if (pendingSessions.length > 0) {
            await this.retryOperation(async () => {
                const { error } = await client.from('sessions').upsert(
                    pendingSessions.map(s => ({
                        id: s.id,
                        user_id: userId,
                        json_data: { ...s, _synced: true },
                        updated_at: new Date(s.updatedAt || Date.now()).toISOString(),
                        deleted_at: s.deletedAt ? new Date(s.deletedAt).toISOString() : null
                    })),
                    { onConflict: 'id' }
                );
                if (error) throw error;
                markSessionsSynced(pendingSessions.map(s => s.id));
            });
        }

        // 2. Routines
        const pendingRoutines = routines.filter(r => !r._synced);
        if (pendingRoutines.length > 0) {
            await this.retryOperation(async () => {
                const { error } = await client.from('routines').upsert(
                    pendingRoutines.map(r => ({
                        id: r.id,
                        user_id: userId,
                        json_data: { ...r, _synced: true },
                        updated_at: new Date(r.updatedAt || Date.now()).toISOString(),
                        deleted_at: r.deletedAt ? new Date(r.deletedAt).toISOString() : null
                    })),
                    { onConflict: 'id' }
                );
                if (error) throw error;
                markRoutinesSynced(pendingRoutines.map(r => r.id));
            });
        }

        // 3. Exercises (Push all for now as we don't track synced on exercises explicitly in some versions, 
        // but let's check if we can filter. createExerciseSlice doesn't seem to have _synced?
        // Actually createExerciseSlice showed `updatedAt`.
        // We'll push all custom exercises for safety or check if we can optimize.)
        // For strict reliability, we map all.
        if (exercises.length > 0) {
            await this.retryOperation(async () => {
                const { error } = await client.from('exercises').upsert(
                    exercises.map(e => ({
                        id: e.id,
                        user_id: userId,
                        json_data: e,
                        updated_at: new Date(e.updatedAt || Date.now()).toISOString(),
                        deleted_at: null // Exercises soft delete not fully implemented?
                    })),
                    { onConflict: 'id' }
                );
                if (error && !error.message?.includes('does not exist')) throw error;
            });
        }
    }

    public async sync() {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;
        if (this.isSyncing) return;

        const client = this.getClient();
        if (!client) return;

        this.isSyncing = true;

        try {
            await this.pull(client);
            await this.push(client);
            useWorkoutStore.getState().updateUserStats({ lastSyncTime: Date.now() });
        } catch (err) {
            logger.warn('SyncService', 'Sync cycle incomplete', err);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Reset the Supabase client — call after credentials change in Settings
     */
    public reset(): void {
        this.client = null;
        this.currentUrl = '';
    }
}

export const syncService = new SyncService();
