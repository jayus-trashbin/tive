/**
 * Photo Sync Service
 * 
 * Multi-layer persistence strategy:
 * - Layer 1 (Primary): IndexedDB (fast, local)
 * - Layer 2 (Backup): Supabase Storage (cloud)
 * - Queue: LocalStorage (pending syncs)
 * 
 * @agent @database-architect @performance-optimizer
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { ProgressPhoto } from '../types/photo';
import { logger } from '../utils/logger';
import { credentialsStore } from '../utils/credentialsStore';

const SYNC_QUEUE_KEY = 'tive_photo_sync_queue';
const SUPABASE_BUCKET = 'progress-photos';

interface SyncQueueItem {
    photoId: string;
    action: 'upload' | 'delete';
    timestamp: number;
    retries: number;
}

type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

class PhotoSyncService {
    private client: SupabaseClient | null = null;
    private currentUrl: string = '';
    private isSyncing = false;
    private syncStatuses: Map<string, SyncStatus> = new Map();

    constructor() {
        // Auto-sync when coming back online
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.processQueue();
            });

            // Process queue on app load
            setTimeout(() => this.processQueue(), 5000);
        }
    }

    private getClient(): SupabaseClient | null {
        const supabaseUrl = credentialsStore.getSupabaseUrl() || useWorkoutStore.getState().userStats.supabaseUrl;
        const supabaseKey = credentialsStore.getSupabaseKey() || useWorkoutStore.getState().userStats.supabaseKey;
        if (!supabaseUrl || !supabaseKey) return null;

        if (!this.client || this.currentUrl !== supabaseUrl) {
            try {
                this.client = createClient(supabaseUrl, supabaseKey, {
                    auth: { persistSession: false },
                });
                this.currentUrl = supabaseUrl;
            } catch (e) {
                logger.error('PhotoSync', 'Invalid Supabase config', e);
                return null;
            }
        }
        return this.client;
    }

    // ==========================================
    // QUEUE MANAGEMENT
    // ==========================================

    private getQueue(): SyncQueueItem[] {
        try {
            const raw = localStorage.getItem(SYNC_QUEUE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    private saveQueue(queue: SyncQueueItem[]): void {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    }

    private addToQueue(item: Omit<SyncQueueItem, 'timestamp' | 'retries'>): void {
        const queue = this.getQueue();

        // Remove duplicates
        const filtered = queue.filter(q =>
            !(q.photoId === item.photoId && q.action === item.action)
        );

        filtered.push({
            ...item,
            timestamp: Date.now(),
            retries: 0,
        });

        this.saveQueue(filtered);
    }

    private removeFromQueue(photoId: string, action: 'upload' | 'delete'): void {
        const queue = this.getQueue();
        const filtered = queue.filter(q =>
            !(q.photoId === photoId && q.action === action)
        );
        this.saveQueue(filtered);
    }

    // ==========================================
    // SYNC OPERATIONS
    // ==========================================

    /**
     * Queue a photo for cloud backup
     */
    public queueUpload(photo: ProgressPhoto): void {
        this.addToQueue({ photoId: photo.id, action: 'upload' });
        this.syncStatuses.set(photo.id, 'pending');

        // Try immediate sync if online
        if (navigator.onLine) {
            this.processQueue();
        }
    }

    /**
     * Queue a photo deletion
     */
    public queueDelete(photoId: string): void {
        this.addToQueue({ photoId, action: 'delete' });
        this.syncStatuses.delete(photoId);

        if (navigator.onLine) {
            this.processQueue();
        }
    }

    /**
     * Get sync status for a photo
     */
    public getSyncStatus(photoId: string): SyncStatus {
        return this.syncStatuses.get(photoId) || 'pending';
    }

    /**
     * Process all queued operations
     */
    public async processQueue(): Promise<void> {
        if (this.isSyncing) return;
        if (!navigator.onLine) return;

        const client = this.getClient();
        if (!client) return;

        const queue = this.getQueue();
        if (queue.length === 0) return;

        this.isSyncing = true;

        for (const item of queue) {
            try {
                if (item.action === 'upload') {
                    await this.uploadPhoto(client, item.photoId);
                } else {
                    await this.deletePhoto(client, item.photoId);
                }
                this.removeFromQueue(item.photoId, item.action);
            } catch (error) {
                logger.warn('PhotoSync', `Failed ${item.action} for ${item.photoId}`, error);

                // Update retry count
                const updatedQueue = this.getQueue().map(q => {
                    if (q.photoId === item.photoId && q.action === item.action) {
                        return { ...q, retries: q.retries + 1 };
                    }
                    return q;
                });

                // Remove after 5 failed retries
                const filtered = updatedQueue.filter(q => q.retries < 5);
                this.saveQueue(filtered);

                this.syncStatuses.set(item.photoId, 'failed');
            }
        }

        this.isSyncing = false;
    }

    private async uploadPhoto(client: SupabaseClient, photoId: string): Promise<void> {
        // Get photo from store
        const { photos } = useWorkoutStore.getState();
        const photo = photos.find(p => p.id === photoId);

        if (!photo) {
            logger.warn('PhotoSync', `Photo ${photoId} not found in store`);
            return;
        }

        this.syncStatuses.set(photoId, 'syncing');

        // Convert base64 to blob
        const base64Data = photo.imageData.split(',')[1];
        const blob = this.base64ToBlob(base64Data, 'image/jpeg');

        // Upload to Supabase Storage
        const path = `${photoId}.jpg`;
        const { error } = await client.storage
            .from(SUPABASE_BUCKET)
            .upload(path, blob, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (error) {
            throw error;
        }

        // Also store metadata in a table for restoration
        await client.from('photo_metadata').upsert({
            id: photoId,
            timestamp: photo.timestamp,
            muscle_groups: photo.muscleGroups,
            bodyweight: photo.metadata.bodyweight,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        this.syncStatuses.set(photoId, 'synced');
    }

    private async deletePhoto(client: SupabaseClient, photoId: string): Promise<void> {
        const path = `${photoId}.jpg`;

        await client.storage
            .from(SUPABASE_BUCKET)
            .remove([path]);

        await client.from('photo_metadata').delete().eq('id', photoId);
    }

    /**
     * Restore all photos from cloud
     */
    public async restoreFromCloud(): Promise<ProgressPhoto[]> {
        const client = this.getClient();
        if (!client) return [];

        const { data: metadataList, error: metaError } = await client
            .from('photo_metadata')
            .select('*')
            .order('timestamp', { ascending: false });

        if (metaError || !metadataList) {
            logger.error('PhotoSync', 'Failed to fetch metadata', metaError);
            return [];
        }

        const restoredPhotos: ProgressPhoto[] = [];

        for (const meta of metadataList) {
            try {
                const { data, error } = await client.storage
                    .from(SUPABASE_BUCKET)
                    .download(`${meta.id}.jpg`);

                if (error || !data) continue;

                const base64 = await this.blobToBase64(data);

                restoredPhotos.push({
                    id: meta.id,
                    timestamp: meta.timestamp,
                    muscleGroups: meta.muscle_groups || [],
                    imageData: base64,
                    thumbnailData: base64, // Use same for simplicity
                    metadata: {
                        bodyweight: meta.bodyweight,
                        camera: 'front',
                    },
                });
            } catch (e) {
                logger.warn('PhotoSync', `Failed to restore ${meta.id}`, e);
            }
        }

        return restoredPhotos;
    }

    // ==========================================
    // HELPERS
    // ==========================================

    private base64ToBlob(base64: string, mimeType: string): Blob {
        const byteString = atob(base64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ab], { type: mimeType });
    }

    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Get pending queue count
     */
    public getPendingCount(): number {
        return this.getQueue().length;
    }

    /**
     * Reset the Supabase client — call after credentials change in Settings
     */
    public reset(): void {
        this.client = null;
        this.currentUrl = '';
    }
}

export const photoSyncService = new PhotoSyncService();
