
import React, { useMemo } from 'react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getWeeklyMuscleVolume } from '../../utils/analytics';
import { formatVolume } from '../../utils/analytics';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MuscleGroup } from '../../types';

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
    chest: 'Chest',
    back: 'Back',
    'upper legs': 'Quads / Hams',
    'lower legs': 'Calves',
    shoulders: 'Shoulders',
    arms: 'Arms',
    core: 'Core',
    cardio: 'Cardio'
};

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
    chest: 'bg-blue-500',
    back: 'bg-emerald-500',
    'upper legs': 'bg-violet-500',
    'lower legs': 'bg-cyan-500',
    shoulders: 'bg-orange-500',
    arms: 'bg-pink-500',
    core: 'bg-yellow-500',
    cardio: 'bg-red-500'
};

/**
 * E-03 — Weekly Muscle Volume Comparison.
 * Shows this week vs last week volume per muscle group with a delta indicator.
 */
const WeeklyMuscleComparison: React.FC = () => {
    const history = useWorkoutStore(state => state.history);
    const exercises = useWorkoutStore(state => state.exercises);

    const data = useMemo(
        () => getWeeklyMuscleVolume(history, exercises),
        // Recompute when session count changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [history.length, exercises.length]
    );

    // Only show muscles that have been trained at least once in the last 2 weeks
    const active = data.filter(d => d.thisWeek > 0 || d.lastWeek > 0);

    if (active.length === 0) {
        return (
            <div className="text-center py-8 text-zinc-600 text-xs">
                No data for this week yet. Train to see muscle volume.
            </div>
        );
    }

    const maxVol = Math.max(...active.map(d => Math.max(d.thisWeek, d.lastWeek)), 1);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <span className="section-title">Weekly Volume</span>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[9px] text-zinc-500">
                        <span className="w-2 h-2 rounded-full bg-brand-primary/70 inline-block" />
                        This week
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-zinc-600">
                        <span className="w-2 h-2 rounded-full bg-zinc-700 inline-block" />
                        Last week
                    </span>
                </div>
            </div>

            {active.map(({ muscle, thisWeek, lastWeek, deltaPct, sets }) => {
                const thisBar = (thisWeek / maxVol) * 100;
                const lastBar = (lastWeek / maxVol) * 100;
                const isUp = deltaPct !== null && deltaPct > 5;
                const isDown = deltaPct !== null && deltaPct < -5;

                return (
                    <div key={muscle} className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                {MUSCLE_LABELS[muscle as MuscleGroup]}
                            </span>
                            <div className="flex items-center gap-2">
                                {deltaPct !== null ? (
                                    <span className={cn(
                                        'flex items-center gap-0.5 text-[9px] font-bold',
                                        isUp ? 'text-brand-success' : isDown ? 'text-red-400' : 'text-zinc-500'
                                    )}>
                                        {isUp ? <TrendingUp size={9} /> : isDown ? <TrendingDown size={9} /> : <Minus size={9} />}
                                        {isUp ? '+' : ''}{deltaPct.toFixed(0)}%
                                    </span>
                                ) : (
                                    <span className="text-[9px] text-zinc-600">—</span>
                                )}
                                <span className="text-[9px] text-zinc-600 font-mono">
                                    {formatVolume(thisWeek)} kg
                                </span>
                                {sets > 0 && (
                                    <span className="text-[9px] text-zinc-700 font-mono">
                                        {sets}s
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Dual bar: last week behind, this week in front */}
                        <div className="relative h-2 rounded-full bg-zinc-900 overflow-hidden">
                            {/* Last week — underlying */}
                            <div
                                className="absolute inset-y-0 left-0 bg-zinc-700/50 rounded-full transition-all duration-700"
                                style={{ width: `${lastBar}%` }}
                            />
                            {/* This week — overlaid */}
                            <div
                                className={cn(
                                    'absolute inset-y-0 left-0 rounded-full transition-all duration-700',
                                    MUSCLE_COLORS[muscle as MuscleGroup] || 'bg-brand-primary'
                                )}
                                style={{ width: `${thisBar}%`, opacity: 0.8 }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default WeeklyMuscleComparison;
