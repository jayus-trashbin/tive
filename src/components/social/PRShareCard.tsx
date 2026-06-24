import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, CheckCheck, Trophy } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getRecentPRs } from '../../utils/analytics';

const PRShareCard: React.FC = () => {
    const { history, exercises, userStats } = useWorkoutStore();
    const [copied, setCopied] = useState(false);

    const prs = useMemo(
        () => getRecentPRs(history, exercises, 5),
        [history, exercises]
    );

    const shareText = useMemo(() => {
        if (prs.length === 0) return null;

        const lines = [
            `💪 ${userStats.name || 'My'} Personal Records — TIVE`,
            '',
            ...prs.map((pr, i) =>
                `${['🥇','🥈','🥉','4️⃣','5️⃣'][i]} ${pr.exerciseName}: ${pr.estimated1RM.toFixed(1)}kg 1RM (${pr.weight}×${pr.reps})`
            ),
            '',
            `📊 Wilks: ${Math.round(userStats.wilksScore || 0)}`,
            `🔥 Tracked with TIVE`,
        ];

        return lines.join('\n');
    }, [prs, userStats]);

    const handleShare = async () => {
        if (!shareText) return;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'My PRs — TIVE', text: shareText });
            } catch {
                // User cancelled
            }
        } else {
            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCopy = async () => {
        if (!shareText) return;
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Trophy size={14} className="text-brand-primary" />
                <span className="text-caption-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Share Your PRs
                </span>
            </div>

            {prs.length === 0 ? (
                <div className="text-center py-8">
                    <Trophy size={28} className="text-zinc-700 mx-auto mb-2" />
                    <p className="text-zinc-500 text-sm font-medium">No PRs yet.</p>
                    <p className="text-zinc-700 text-xs font-medium mt-1">Complete workouts to set records!</p>
                </div>
            ) : (
                <>
                    {/* Preview Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-lg p-5 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white font-medium uppercase tracking-wide">
                                {userStats.name || 'My'} PRs
                            </span>
                            <span className="text-caption-xs font-medium text-brand-primary border border-brand-primary/30 px-2 py-0.5 rounded-lg">
                                TIVE
                            </span>
                        </div>

                        <div className="space-y-2">
                            {prs.map((pr, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-sm">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-caption-xs font-medium text-zinc-300 truncate block">
                                            {pr.exerciseName}
                                        </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-caption font-bold text-white font-medium">
                                            {pr.estimated1RM.toFixed(1)}kg
                                        </span>
                                        <span className="text-caption-xs font-medium text-zinc-600 ml-1">1RM</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {(userStats.wilksScore || 0) > 0 && (
                            <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                                <span className="text-caption-xs font-medium text-zinc-500">Wilks Score</span>
                                <span className="text-sm font-bold text-brand-primary font-medium">
                                    {Math.round(userStats.wilksScore)}
                                </span>
                            </div>
                        )}
                    </motion.div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        {'share' in navigator && (
                            <button
                                onClick={handleShare}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-primary text-black text-caption-xs font-bold uppercase rounded-lg transition-all active:scale-95"
                            >
                                <Share2 size={12} />
                                Share
                            </button>
                        )}
                        <button
                            onClick={handleCopy}
                            className="flex-1 flex items-center justify-center gap-2 py-3 border border-zinc-700 text-zinc-400 text-caption-xs font-bold uppercase rounded-lg hover:border-zinc-500 hover:text-white transition-all active:scale-95"
                        >
                            {copied ? <CheckCheck size={12} className="text-brand-success" /> : <Copy size={12} />}
                            {copied ? 'Copied!' : 'Copy Text'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default PRShareCard;
