import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Activity } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getMuscleFatigueTimeline } from '../../utils/analytics';
import { MuscleGroup } from '../../types/domain';
import { Button, EmptyState } from '../ui';
import { useTranslation } from '../../i18n';

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
    chest: '#f87171',
    back: '#60a5fa',
    'upper legs': '#4ade80',
    'lower legs': '#86efac',
    shoulders: '#c084fc',
    arms: '#fb923c',
    core: '#facc15',
    cardio: '#94a3b8',
};

const TRACKED: MuscleGroup[] = ['chest', 'back', 'upper legs', 'shoulders', 'arms', 'lower legs'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-2xl">
            <p className="text-caption-xs font-bold text-zinc-500 uppercase mb-2">
                {new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </p>
            {payload.map((entry: any) => (
                <div key={entry.dataKey} className="flex items-center gap-2 text-caption-xs font-bold">
                    <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                    <span className="text-zinc-400 capitalize">{entry.dataKey.replace('_', ' ')}</span>
                    <span className="text-white ml-auto">{entry.value}%</span>
                </div>
            ))}
        </div>
    );
};

const RecoveryTimeline: React.FC = () => {
    const history = useWorkoutStore(s => s.history);
    const exercises = useWorkoutStore(s => s.exercises);
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        const snapshots = getMuscleFatigueTimeline(history, exercises, 14);
        return snapshots.map(snap => {
            const row: Record<string, number | string> = {
                date: snap.date,
            };
            TRACKED.forEach(m => {
                // recharts key cannot have spaces
                row[m.replace(' ', '_')] = snap.scores[m] ?? 100;
            });
            return row;
        });
    }, [history, exercises]);

    if (history.length < 2) {
        return (
            <EmptyState
                icon={Activity}
                title={t('analytics.recoveryEmptyTitle')}
                description={t('analytics.recoveryEmptyDesc')}
                compact
            />

        );
    }

    return (
        <div className="space-y-3">
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(ts: number) => {
                            const d = new Date(ts);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                        tick={{ fill: '#52525b', fontSize: 8, fontFamily: 'monospace' }}
                        axisLine={false}
                        tickLine={false}
                        dy={8}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fill: '#52525b', fontSize: 8, fontFamily: 'monospace' }}
                        axisLine={false}
                        tickLine={false}
                        tickCount={3}
                        tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {TRACKED.map(muscle => (
                        <Line
                            key={muscle}
                            type="monotone"
                            dataKey={muscle.replace(' ', '_')}
                            stroke={MUSCLE_COLORS[muscle]}
                            strokeWidth={1.5}
                            dot={false}
                            activeDot={{ r: 3 }}
                            animationDuration={800}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            {/* Compact legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
                {TRACKED.map(muscle => (
                    <div key={muscle} className="flex items-center gap-1.5">
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: MUSCLE_COLORS[muscle] }}
                        />
                        <span className="text-caption-xs font-medium text-zinc-500 capitalize">{muscle}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecoveryTimeline;
