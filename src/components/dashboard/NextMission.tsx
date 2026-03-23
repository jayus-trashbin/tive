import React from 'react';
import { Target, Play, Dumbbell, Zap, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Routine } from '../../types';
import { cn } from '../../lib/utils';
import { estimateRoutineDuration } from '../../utils/engine';

interface NextMissionProps {
    nextRoutine: Routine | null;
    onStart: (id: string) => void;
}

export const NextMission: React.FC<NextMissionProps> = ({ nextRoutine, onStart }) => {
    if (!nextRoutine) return <EmptyMission />;

    return (
        <section className="shrink-0">
            <div className="section-title mb-3">
                <Target size={12} className="text-brand-primary" /> Next Workout
            </div>

            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => onStart(nextRoutine.id)}
                className="relative overflow-hidden card-elevated cursor-pointer group"
                style={{ aspectRatio: '2 / 1' }}
            >
                {/* Grid background */}
                <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-primary/5 blur-3xl pointer-events-none" />

                {/* Top row */}
                <div className="relative z-10 p-5 flex justify-between items-start">
                    <div className="px-2 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-[2px]">
                        <span className="data-label text-brand-primary">Ready to Go</span>
                    </div>
                    <div className="w-12 h-12 bg-white text-black flex items-center justify-center rounded-[2px] shadow-tech group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-transform duration-200">
                        <Play size={20} fill="black" />
                    </div>
                </div>

                {/* Bottom row */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
                    <h3 className="text-2xl font-heading font-black text-white mb-2 leading-none uppercase tracking-tight">
                        {nextRoutine.name}
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-zinc-500 data-label">
                            <Dumbbell size={12} />
                            {nextRoutine.exerciseIds.length} EXERCISES
                        </div>
                        <div className="h-3 w-px bg-zinc-700" />
                        <div className="flex items-center gap-1.5 text-zinc-500 data-label">
                            <Zap size={12} />
                            ~{estimateRoutineDuration(nextRoutine)} MIN
                        </div>
                    </div>
                </div>

                {/* Bottom tech bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] flex">
                    {[...Array(24)].map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex-1 h-full",
                                i < 8 ? "bg-brand-primary/40" : "bg-zinc-800"
                            )}
                        />
                    ))}
                </div>
            </motion.div>
        </section>
    );
};

const EmptyMission: React.FC = () => (
    <div className="card-subtle border-dashed p-10 text-center flex flex-col items-center justify-center" style={{ aspectRatio: '2 / 1' }}>
        <Calendar size={28} className="text-zinc-700 mb-4" />
        <h3 className="text-white font-heading font-bold text-lg uppercase tracking-tight">No Active Plan</h3>
        <p className="text-zinc-600 data-label mt-1 mb-5">Create a routine to unlock AI mapping</p>
        <button className="btn-tech text-[10px]">
            Create Routine
        </button>
    </div>
);
