import React from 'react';
import { Trophy, Dumbbell, Target } from 'lucide-react';
import { Exercise } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
    exercise: Exercise;
}

export const ExerciseInfo: React.FC<Props> = ({ exercise }) => {
    const getMuscleColor = (muscle: string) => {
        const m = muscle.toLowerCase();
        if (m.includes('chest')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        if (m.includes('back')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        if (m.includes('upper legs') || m.includes('glute') || m.includes('quad')) return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
        if (m.includes('lower legs') || m.includes('calf')) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
        if (m.includes('shoulder')) return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
        if (m.includes('arm') || m.includes('bicep') || m.includes('tricep')) return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
        return 'text-zinc-300 bg-zinc-800 border-zinc-700';
    };

    return (
        <div className="px-6 pt-6 pb-2">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className={cn(
                            "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border",
                            getMuscleColor(exercise.targetMuscle)
                        )}>
                            {exercise.targetMuscle}
                        </span>
                        {exercise.equipment && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border border-zinc-800 bg-zinc-900 text-zinc-400 flex items-center gap-1.5">
                                <Dumbbell size={10} /> {exercise.equipment}
                            </span>
                        )}
                        {exercise.isUnilateral && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border border-zinc-800 bg-zinc-900 text-zinc-400 flex items-center gap-1.5">
                                <Target size={10} /> Unilateral
                            </span>
                        )}
                    </div>
                    <h2 className="text-3xl font-black text-white leading-tight mb-1">
                        {exercise.name}
                    </h2>
                </div>

                {/* Personal Record Badge */}
                {exercise.personalRecord && (
                    <div className="flex flex-col items-end shrink-0 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 px-4 py-3 rounded-2xl border border-brand-primary/20">
                        <span className="text-[9px] font-bold text-brand-primary uppercase tracking-widest flex items-center gap-1 mb-0.5">
                            <Trophy size={10} /> Best
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white font-mono leading-none">
                                {exercise.personalRecord}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase">KG</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
