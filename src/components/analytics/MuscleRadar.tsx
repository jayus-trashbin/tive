import React, { useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getMuscleVolumeDistribution } from '../../utils/analytics';

const MUSCLE_LABELS: Record<string, string> = {
    'chest': 'CHEST',
    'back': 'BACK',
    'upper legs': 'LEGS',
    'lower legs': 'CALVES',
    'shoulders': 'SHOULDERS',
    'arms': 'ARMS'
};

const MuscleRadar: React.FC = () => {
    const history = useWorkoutStore(state => state.history);
    const exercises = useWorkoutStore(state => state.exercises);

    const data = useMemo(() => {
        const distribution = getMuscleVolumeDistribution(history, exercises, 30);
        return distribution.map(d => ({
            muscle: MUSCLE_LABELS[d.muscle] || d.muscle.toUpperCase(),
            value: d.percentage,
            fullMark: 100
        }));
    }, [history, exercises]);

    // Check if any data
    const hasData = useMemo(() =>
        data.some(d => d.value > 0),
        [data]
    );

    return (
        <div className="h-full w-full">

            {/* Radar Chart */}
            {hasData ? (
                <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                            <PolarGrid
                                stroke="#27272a"
                                gridType="polygon"
                            />
                            <PolarAngleAxis
                                dataKey="muscle"
                                tick={{
                                    fill: '#71717a',
                                    fontSize: 9,
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold'
                                }}
                            />
                            <Radar
                                dataKey="value"
                                stroke="#a3e635"
                                strokeWidth={2}
                                fill="#a3e635"
                                fillOpacity={0.2}
                                animationDuration={800}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 border-2 border-dashed border-zinc-800 flex items-center justify-center mb-3">
                        <span className="text-2xl font-mono text-zinc-700">?</span>
                    </div>
                    <p className="text-sm font-mono text-zinc-500">No training data</p>
                    <p className="text-[10px] font-mono text-zinc-600 mt-1">
                        Complete workouts to see muscle balance
                    </p>
                </div>
            )}

            {/* Legend */}
            {hasData && (
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {data.map(d => (
                        <div
                            key={d.muscle}
                            className="text-[9px] font-mono text-zinc-500"
                        >
                            <span className="text-white">{d.muscle}</span>
                            <span className="ml-1 text-brand-primary">{d.value}%</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MuscleRadar;
