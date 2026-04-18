import React, { useMemo, useState } from 'react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getMostUsedExercises } from '../../utils/analytics';
import { Dumbbell, ChevronRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Exercise } from '../../types';
import { formatVolume } from '../../utils/analytics';
import ExerciseDetailModal from '../exercise/ExerciseDetailModal';
import { cn } from '../../lib/utils';

const MUSCLE_COLOR: Record<string, string> = {
    chest: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    back: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'upper legs': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    shoulders: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    arms: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    core: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'lower legs': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    cardio: 'bg-red-500/20 text-red-400 border-red-500/30',
};

/**
 * A-04 — Top exercises ranked by set count with volume,
 * tapping opens the ExerciseDetailModal.
 */
const TopExercises: React.FC<{ limit?: number }> = ({ limit = 8 }) => {
    const history = useWorkoutStore(s => s.history);
    const exercises = useWorkoutStore(s => s.exercises);
    const [selected, setSelected] = useState<Exercise | null>(null);

    const top = useMemo(
        () => getMostUsedExercises(history, exercises, limit),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [history.length, exercises.length, limit]
    );

    const maxSets = top[0]?.setCount || 1;

    if (top.length === 0) {
        return (
            <div className="text-center py-8 text-zinc-600 text-xs font-mono">
                No exercise data yet. Complete a workout to see your top exercises.
            </div>
        );
    }

    return (
        <>
            <div className="space-y-2">
                {top.map(({ exercise, setCount, totalVolume }, i) => {
                    const barPct = (setCount / maxSets) * 100;
                    const muscleClass = MUSCLE_COLOR[exercise.targetMuscle] || 'bg-zinc-800 text-zinc-400 border-zinc-700';

                    return (
                        <motion.button
                            key={exercise.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => setSelected(exercise)}
                            className="w-full text-left"
                        >
                            <div className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-[4px] hover:border-zinc-700 transition-colors group">
                                {/* Rank */}
                                <span className="text-[10px] font-black font-mono text-zinc-600 w-4 shrink-0">
                                    {i + 1}
                                </span>

                                {/* Thumbnail */}
                                <div className="w-8 h-8 rounded bg-zinc-800 overflow-hidden shrink-0">
                                    {exercise.staticImageUrl || exercise.gifUrl ? (
                                        <img
                                            src={exercise.staticImageUrl || exercise.gifUrl}
                                            className="w-full h-full object-cover opacity-70"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Dumbbell size={12} className="text-zinc-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[11px] font-bold text-white truncate group-hover:text-brand-primary transition-colors">
                                            {exercise.name}
                                        </span>
                                        <span className={cn(
                                            'text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0',
                                            muscleClass
                                        )}>
                                            {exercise.targetMuscle}
                                        </span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand-primary/60 rounded-full transition-all duration-700"
                                            style={{ width: `${barPct}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="text-right shrink-0">
                                    <div className="text-[11px] font-black text-white font-mono">{setCount}s</div>
                                    <div className="text-[9px] text-zinc-600 font-mono">{formatVolume(totalVolume)}kg</div>
                                </div>

                                <ChevronRight size={12} className="text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0" />
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Detail Modal */}
            {selected && (
                <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />
            )}
        </>
    );
};

export default TopExercises;
