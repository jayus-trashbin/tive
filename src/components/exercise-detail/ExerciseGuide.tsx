import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Activity } from 'lucide-react';
import { Exercise } from '../../types';

interface Props {
    exercise: Exercise;
}

export const ExerciseGuide: React.FC<Props> = ({ exercise }) => {
    return (
        <motion.div
            key="guide"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
        >
            {/* Overview */}
            {exercise.overview && (
                <div className="text-sm text-zinc-300 leading-relaxed font-medium bg-zinc-900/30 p-4 rounded-2xl border border-white/5">
                    {exercise.overview}
                </div>
            )}

            {/* Pro Tips / Key Cues (Real Data) --- */}
            {exercise.tips && exercise.tips.length > 0 && (
                <div className="bg-brand-primary/5 border border-brand-primary/20 p-5 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-brand-primary">
                        <Sparkles size={64} />
                    </div>
                    <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                        <Sparkles size={14} /> Professional Cues
                    </h4>
                    <ul className="space-y-4 relative z-10">
                        {exercise.tips.map((tip, i) => (
                            <li key={i} className="text-sm text-zinc-200 flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0 mt-0.5 text-brand-primary font-bold text-[10px]">
                                    {i + 1}
                                </div>
                                <span className="leading-snug">{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Variations */}
            {exercise.variations && exercise.variations.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
                        Common Variations
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {exercise.variations.map((v, i) => (
                            <span key={i} className="px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-400 font-medium hover:text-white hover:border-zinc-700 transition-colors cursor-default">
                                {v}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Step-by-Step */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                    <Activity size={14} /> Execution
                </h3>
                {exercise.instructions && exercise.instructions.length > 0 ? (
                    <div className="relative border-l-2 border-zinc-800 ml-3 space-y-0 py-2">
                        {exercise.instructions.map((step, i) => (
                            <div key={i} className="relative pl-8 pb-8 last:pb-0 group">
                                {/* Node */}
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-zinc-950 border-2 border-zinc-700 group-hover:border-brand-primary group-hover:scale-110 transition-all flex items-center justify-center shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-brand-primary transition-colors" />
                                </div>

                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 group-hover:text-brand-primary transition-colors">
                                    Step {i + 1}
                                </h4>
                                <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                                    {step}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                            <Activity size={24} />
                        </div>
                        <p className="text-zinc-400 text-sm">
                            Standard form applies. Focus on the mind-muscle connection.
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
