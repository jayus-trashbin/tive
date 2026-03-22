import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getWeeklySummary } from '../../utils/analytics';
import { Calendar as CalendarIcon } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 p-2 rounded shadow-xl">
                <div className="text-[10px] font-mono font-bold text-zinc-400 mb-1">{label}</div>
                <div className="text-xs font-bold text-brand-primary">
                    {payload[0].value} Workouts
                </div>
            </div>
        );
    }
    return null;
};

const FrequencyHeatmap: React.FC = () => {
    const history = useWorkoutStore(state => state.history);

    // Get last 12 weeks of data
    const data = useMemo(() => {
        return getWeeklySummary(history, 12).map(week => {
            const date = new Date(week.weekStart);
            const label = `${date.getDate()}/${date.getMonth() + 1}`;
            return {
                ...week,
                label,
                fullMark: 7 // Max days in a week used for scaling expectation if needed
            };
        });
    }, [history]);

    // ... tooltip code ...

    const hasData = useMemo(() => data.some(d => d.sessions > 0), [data]);

    if (!hasData) {
        return (
            <div className="h-[180px] flex items-center justify-center">
                <EmptyState
                    icon={CalendarIcon}
                    title="No Training Data"
                    description="Consistency is key. Log workouts to see your streak."
                />
            </div>
        );
    }

    return (
        <div className="h-[180px] w-full min-w-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barSize={12}>
                    <XAxis
                        dataKey="label"
                        tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }}
                        axisLine={false}
                        tickLine={false}
                        interval={1} // Skip every other label to fit
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    />
                    <Bar
                        dataKey="sessions"
                        radius={[2, 2, 0, 0]}
                        animationDuration={1500}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.sessions >= 3 ? '#a3e635' : entry.sessions > 0 ? '#4d7c0f' : '#27272a'}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default FrequencyHeatmap;
