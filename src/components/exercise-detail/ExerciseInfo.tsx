
import React from 'react';
import {
    Trophy, Dumbbell, Target, Users,
    Link2, Settings2, PersonStanding, Minus, Triangle
} from 'lucide-react';
import { Exercise } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
    exercise: Exercise;
}

// Equipment → label + lucide icon
const EQUIPMENT_META: Record<string, { label: string; icon: React.ReactNode }> = {
    'barbell':        { label: 'Barbell',     icon: <Dumbbell size={14} strokeWidth={2} /> },
    'dumbbell':       { label: 'Dumbbells',   icon: <Dumbbell size={14} strokeWidth={2} /> },
    'cable':          { label: 'Cable',       icon: <Link2 size={14} strokeWidth={2} /> },
    'machine':        { label: 'Machine',     icon: <Settings2 size={14} strokeWidth={2} /> },
    'body weight':    { label: 'Bodyweight',  icon: <PersonStanding size={14} strokeWidth={2} /> },
    'kettlebell':     { label: 'Kettlebell',  icon: <Dumbbell size={14} strokeWidth={2} /> },
    'resistance band':{ label: 'Band',        icon: <Minus size={14} strokeWidth={2.5} /> },
    'ez barbell':     { label: 'EZ Bar',      icon: <Dumbbell size={14} strokeWidth={2} /> },
    'trap bar':       { label: 'Trap Bar',    icon: <Triangle size={14} strokeWidth={2} /> },
    'unknown':        { label: 'Free',        icon: <PersonStanding size={14} strokeWidth={2} /> },
};

const getEquipmentMeta = (equipment: string) => {
    const key = (equipment || '').toLowerCase();
    return EQUIPMENT_META[key] || { label: equipment || 'Free', icon: <Dumbbell size={14} strokeWidth={2} /> };
};

const MUSCLE_COLORS: Record<string, string> = {
    chest: 'text-sky-400 bg-sky-400/10 border-sky-400/25',
    back: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
    shoulders: 'text-violet-400 bg-violet-400/10 border-violet-400/25',
    'upper legs': 'text-amber-400 bg-amber-400/10 border-amber-400/25',
    'lower legs': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
    arms: 'text-rose-400 bg-rose-400/10 border-rose-400/25',
    core: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/25',
    cardio: 'text-red-400 bg-red-400/10 border-red-400/25',
};

const getMuscleColor = (muscle: string) => {
    const m = muscle.toLowerCase();
    for (const [key, cls] of Object.entries(MUSCLE_COLORS)) {
        if (m.includes(key.split(' ')[0])) return cls;
    }
    return 'text-zinc-300 bg-zinc-800 border-zinc-700';
};

export const ExerciseInfo: React.FC<Props> = ({ exercise }) => {
    const equipMeta = getEquipmentMeta(exercise.equipment || 'unknown');
    const secondaryMuscles = exercise.secondaryMuscles?.filter(Boolean) || [];
    const hasSecondary = secondaryMuscles.length > 0;

    return (
        <div className="px-6 pt-6 pb-3 space-y-4">
            {/* Top Row: Name + PR Badge */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Primary Muscle Pill */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={cn(
                            'px-2.5 py-1 rounded-md text-caption-xs font-bold uppercase tracking-wide border',
                            getMuscleColor(exercise.targetMuscle)
                        )}>
                            {exercise.targetMuscle}
                        </span>
                        {exercise.isUnilateral && (
                            <span className="px-2.5 py-1 rounded-md text-caption-xs font-bold uppercase tracking-wide border border-zinc-800 bg-zinc-900 text-zinc-500 flex items-center gap-1.5">
                                <Target size={9} />
                                Unilateral
                            </span>
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-white leading-tight tracking-tight">
                        {exercise.name}
                    </h2>
                </div>

                {/* Personal Record Badge */}
                {exercise.personalRecord && (
                    <div className="flex flex-col items-end shrink-0 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 px-4 py-3 rounded-2xl border border-brand-primary/20">
                        <span className="text-caption-xs font-bold text-brand-primary uppercase tracking-widest flex items-center gap-1 mb-0.5">
                            <Trophy size={9} /> Best
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-white font-medium leading-none">
                                {exercise.personalRecord}
                            </span>
                            <span className="text-caption-xs text-zinc-400 font-bold uppercase">KG</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Equipment & Secondary Muscles Row */}
            <div className="flex flex-col gap-2">

                {/* Equipment: Card with icon + label */}
                <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                        {equipMeta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-caption-xs text-zinc-500 font-bold uppercase tracking-widest">Equipment</div>
                        <div className="text-sm font-bold text-white capitalize">{equipMeta.label}</div>
                    </div>
                    <Dumbbell size={14} className="text-zinc-700 shrink-0" />
                </div>

                {/* Secondary Muscles (only when available) */}
                {hasSecondary && (
                    <div className="flex items-start gap-3 px-4 py-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center shrink-0 mt-0.5">
                            <Users size={14} className="text-zinc-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-caption-xs text-zinc-500 font-bold uppercase tracking-widest mb-2">Also Works</div>
                            <div className="flex flex-wrap gap-1.5">
                                {secondaryMuscles.slice(0, 5).map((muscle, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-0.5 rounded-md text-caption-xs font-semibold text-zinc-400 bg-zinc-800 border border-zinc-700/80 capitalize"
                                    >
                                        {muscle.toLowerCase()}
                                    </span>
                                ))}
                                {secondaryMuscles.length > 5 && (
                                    <span className="px-2 py-0.5 rounded-md text-caption-xs font-semibold text-zinc-600 bg-zinc-900 border border-zinc-800">
                                        +{secondaryMuscles.length - 5}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
