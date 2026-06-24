import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Upload, RefreshCw, Lock, User } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { credentialsStore } from '../../utils/credentialsStore';
import { cn } from '../../lib/utils';

export interface LeaderboardEntry {
    id: string;
    display_name: string;
    wilks_score: number;
    bodyweight: number;
    gender: 'male' | 'female';
    submitted_at: string;
    isOwn?: boolean;
}

const MEDAL_COLORS = ['text-yellow-400', 'text-zinc-300', 'text-amber-600'];

const WilksLeaderboard: React.FC = () => {
    const { userStats, history, exercises } = useWorkoutStore();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [posted, setPosted] = useState(false);

    const supabaseUrl = credentialsStore.getSupabaseUrl() || userStats.supabaseUrl;
    const supabaseKey = credentialsStore.getSupabaseKey() || userStats.supabaseKey;
    const hasSupabase = Boolean(supabaseUrl && supabaseKey);
    const userName = userStats.name || 'Anonymous';
    const wilks = Math.round(userStats.wilksScore || 0);

    // Local fallback: derive simple leaderboard from own PRs
    const localEntries: LeaderboardEntry[] = wilks > 0 ? [{
        id: 'local-self',
        display_name: userName,
        wilks_score: wilks,
        bodyweight: userStats.bodyweight,
        gender: userStats.gender,
        submitted_at: new Date().toISOString(),
        isOwn: true,
    }] : [];

    const fetchLeaderboard = async () => {
        if (!hasSupabase) return;
        setIsLoading(true);
        setError(null);
        try {
            const client = createClient(supabaseUrl!, supabaseKey!);
            const { data, error: err } = await client
                .from('wilks_leaderboard')
                .select('*')
                .order('wilks_score', { ascending: false })
                .limit(20);

            if (err) throw err;

            const enriched = (data ?? []).map((e: LeaderboardEntry) => ({
                ...e,
                isOwn: e.display_name === userName,
            }));
            setEntries(enriched);
        } catch (e: any) {
            setError(e.message?.includes('does not exist')
                ? 'Leaderboard table not set up in Supabase yet.'
                : e.message ?? 'Failed to load leaderboard.');
        } finally {
            setIsLoading(false);
        }
    };

    const postScore = async () => {
        if (!hasSupabase || wilks === 0) return;
        setIsPosting(true);
        setError(null);
        try {
            const client = createClient(supabaseUrl!, supabaseKey!);
            const { error: err } = await client.from('wilks_leaderboard').upsert({
                display_name: userName,
                wilks_score: wilks,
                bodyweight: userStats.bodyweight,
                gender: userStats.gender,
                submitted_at: new Date().toISOString(),
            }, { onConflict: 'display_name' });

            if (err) throw err;
            setPosted(true);
            await fetchLeaderboard();
        } catch (e: any) {
            setError(e.message ?? 'Failed to post score.');
        } finally {
            setIsPosting(false);
        }
    };

    useEffect(() => {
        if (hasSupabase) fetchLeaderboard();
    }, [hasSupabase]);

    const displayEntries = hasSupabase ? entries : localEntries;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-yellow-400" />
                    <span className="text-caption-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Wilks Leaderboard
                    </span>
                </div>
                {hasSupabase && (
                    <button
                        onClick={fetchLeaderboard}
                        disabled={isLoading}
                        className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors tap"
                    >
                        <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                )}
            </div>

            {/* Your score card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-caption-xs font-medium text-zinc-500 uppercase tracking-wider">Your Wilks</div>
                        <div className="text-2xl font-bold text-white mt-0.5">
                            {wilks > 0 ? wilks : '—'}
                        </div>
                        <div className="text-caption-xs font-medium text-zinc-600 mt-0.5">
                            {userStats.bodyweight}kg · {userStats.gender}
                        </div>
                    </div>
                    {hasSupabase && wilks > 0 && (
                        <button
                            onClick={postScore}
                            disabled={isPosting || posted}
                            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg border text-caption-xs font-bold uppercase transition-all tap',
                                posted
                                    ? 'border-brand-success/30 text-brand-success bg-brand-success/10'
                                    : 'border-zinc-700 text-zinc-400 hover:border-brand-primary hover:text-brand-primary'
                            )}
                        >
                            <Upload size={10} />
                            {isPosting ? 'Posting…' : posted ? 'Posted!' : 'Post Score'}
                        </button>
                    )}
                </div>
            </div>

            {/* No Supabase notice */}
            {!hasSupabase && (
                <div className="flex items-start gap-3 p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                    <Lock size={14} className="text-zinc-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-caption-xs font-medium text-zinc-500">
                            Connect Supabase in Profile settings to join the global leaderboard.
                        </p>
                        <p className="text-caption-xs font-medium text-zinc-700 mt-1">
                            Create a <code className="text-zinc-500">wilks_leaderboard</code> table with columns:
                            display_name, wilks_score, bodyweight, gender, submitted_at.
                        </p>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-caption-xs font-medium text-red-400 bg-red-900/20 border border-red-900/40 rounded-xl p-3">
                    {error}
                </p>
            )}

            {/* Rankings */}
            {displayEntries.length > 0 && (
                <div className="space-y-2">
                    {displayEntries.map((entry, idx) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
                                entry.isOwn
                                    ? 'border-brand-primary/30 bg-brand-primary/5'
                                    : 'border-zinc-800 bg-zinc-900/30'
                            )}
                        >
                            <span className={cn(
                                'w-6 text-center text-caption-xs font-bold',
                                idx < 3 ? MEDAL_COLORS[idx] : 'text-zinc-600'
                            )}>
                                {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                            </span>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <User size={9} className="text-zinc-600" />
                                    <span className={cn(
                                        'text-caption-xs font-bold truncate',
                                        entry.isOwn ? 'text-brand-primary' : 'text-white'
                                    )}>
                                        {entry.display_name}
                                        {entry.isOwn && ' (you)'}
                                    </span>
                                </div>
                                <div className="text-caption-xs font-medium text-zinc-600 mt-0.5">
                                    {entry.bodyweight}kg · {entry.gender}
                                </div>
                            </div>

                            <span className="text-sm font-bold text-white">
                                {Math.round(entry.wilks_score)}
                            </span>
                        </motion.div>
                    ))}
                </div>
            )}

            {hasSupabase && !isLoading && displayEntries.length === 0 && !error && (
                <div className="text-center py-8">
                    <Trophy size={28} className="text-zinc-700 mx-auto mb-2" />
                    <p className="text-zinc-500 text-sm font-medium">No scores yet. Be the first!</p>
                </div>
            )}
        </div>
    );
};

export default WilksLeaderboard;
