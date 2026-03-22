import React, { useMemo } from 'react';
import { Trophy, Calendar, Dumbbell } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getRecentPRs } from '../../utils/analytics';
import { motion } from 'framer-motion';

const PRTimeline: React.FC = () => {
    const { history, exercises } = useWorkoutStore();

    const prs = useMemo(() => {
        return getRecentPRs(history, exercises, 5);
    }, [history, exercises]);

    if (prs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/30 border border-zinc-800 rounded-[4px]">
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
                    <Trophy size={20} className="text-zinc-600" />
                </div>
                <p className="text-xs font-mono text-zinc-500 uppercase">No PRs recorded yet</p>
                <p className="text-[10px] text-zinc-600 mt-1 max-w-[200px]">Push your limits to see your achievements here.</p>
            </div>
        );
    }

    return (
        <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[5px] before:w-[1px] before:bg-zinc-800">
            {prs.map((pr, index) => {
                const date = new Date(pr.date);
                const isRecent = (Date.now() - pr.date) < 7 * 24 * 60 * 60 * 1000;

                return (
                    <motion.div
                        key={`${pr.date}-${pr.exerciseName}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative"
                    >
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[19px] top-1 w-[9px] h-[9px] rounded-sm border ${isRecent ? 'bg-brand-primary border-brand-primary shadow-[0_0_10px_rgba(190,242,100,0.4)]' : 'bg-zinc-900 border-zinc-700'}`} />

                        <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-[4px] hover:border-zinc-700 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-xs font-bold text-white font-mono uppercase">{pr.exerciseName}</h3>
                                <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                                    <Calendar size={10} />
                                    {date.toLocaleDateString()}
                                </span>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-black text-brand-primary font-mono tracking-tighter">
                                    {pr.estimated1RM} <span className="text-[10px] text-zinc-600">KG (1RM)</span>
                                </span>
                                <span className="text-[10px] font-mono text-zinc-500">
                                    {pr.weight}kg × {pr.reps}
                                </span>
                            </div>

                            {isRecent && (
                                <div className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-brand-primary/10 border border-brand-primary/20 rounded-[2px]">
                                    <Trophy size={10} className="text-brand-primary" />
                                    <span className="text-[8px] font-bold text-brand-primary uppercase tracking-wider">New Record</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default PRTimeline;
