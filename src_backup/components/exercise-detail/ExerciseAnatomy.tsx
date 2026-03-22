import React from 'react';
import { motion } from 'framer-motion';
import { Target, Activity, Layers, Zap, Calendar } from 'lucide-react';
import { Exercise } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
    exercise: Exercise;
}

export const ExerciseAnatomy: React.FC<Props> = ({ exercise }) => {
    return (
        <motion.div
            key="anatomy"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            {/* Primary Muscle */}
            <section>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Target size={14} className="text-brand-primary" /> Prime Mover
                </h3>
                <div className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 rounded-3xl flex items-center gap-5">
                    <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                        <Activity size={28} />
                    </div>
                    <div>
                        <span className="block text-xl font-black text-white capitalize tracking-tight">{exercise.targetMuscle}</span>
                        <span className="text-xs text-zinc-500 font-medium">Primary Target Muscle</span>
                    </div>
                </div>
            </section>

            {/* Secondary Muscles */}
            {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                <section>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Layers size={14} /> Synergists
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {exercise.secondaryMuscles.map((m, i) => (
                            <div key={i} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-2.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 shadow-[0_0_5px_currentColor]" />
                                <span className="text-xs font-bold text-zinc-300 capitalize">{m}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Stats Summary */}
            <section className="pt-4 border-t border-zinc-900">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2 flex items-center gap-1.5">
                            <Zap size={12} /> Fatigue Impact
                        </div>
                        <div className="text-white font-bold flex items-center gap-2">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                exercise.fatigueFactor > 1.2 ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-green-500 shadow-[0_0_8px_#22c55e]"
                            )} />
                            {exercise.fatigueFactor > 1.2 ? "High (CNS)" : exercise.fatigueFactor > 0.9 ? "Moderate" : "Low"}
                        </div>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2 flex items-center gap-1.5">
                            <Calendar size={12} /> Last Performed
                        </div>
                        <div className="text-white font-bold flex items-center gap-2">
                            {exercise.lastPerformed
                                ? new Date(exercise.lastPerformed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                : "Never"}
                        </div>
                    </div>
                </div>
            </section>
        </motion.div>
    );
};
