
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getVolumeTimeSeries, formatVolume } from '../../utils/analytics';
import { cn } from '../../lib/utils';

interface VolumeChartProps {
    days?: number;
}

const VolumeChart: React.FC<VolumeChartProps> = ({ days = 30 }) => {
    const { history } = useWorkoutStore();

    const data = useMemo(() => getVolumeTimeSeries(history, days), [history, days]);

    const totalVolume = useMemo(() =>
        data.reduce((acc, d) => acc + d.value, 0),
        [data]
    );

    // Calculate trend (compare last 7 days vs previous 7)
    const trend = useMemo(() => {
        const recent = data.slice(-7).reduce((acc, d) => acc + d.value, 0);
        const previous = data.slice(-14, -7).reduce((acc, d) => acc + d.value, 0);

        if (previous === 0) return { direction: 'neutral', percent: 0 };

        const change = ((recent - previous) / previous) * 100;
        return {
            direction: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral',
            percent: Math.abs(Math.round(change))
        };
    }, [data]);

    const formatXAxis = (timestamp: number) => {
        const date = new Date(timestamp);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            const date = new Date(label);
            return (
                <div className="bg-zinc-900 border border-zinc-800 p-3 font-mono">
                    <p className="text-xs text-zinc-500 uppercase mb-1">
                        {date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-lg font-bold text-brand-primary">
                        {formatVolume(payload[0].value ?? 0)} kg
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-full w-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black font-mono text-white">
                            {formatVolume(totalVolume)}
                        </span>
                        <span className="text-xs font-mono text-zinc-600 uppercase">kg / {days}d</span>
                    </div>
                </div>

                {/* Trend Indicator */}
                <div className={cn(
                    "flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold",
                    trend.direction === 'up' && "bg-brand-success/10 text-brand-success",
                    trend.direction === 'down' && "bg-brand-danger/10 text-brand-danger",
                    trend.direction === 'neutral' && "bg-zinc-800 text-zinc-500"
                )}>
                    {trend.direction === 'up' && <TrendingUp size={14} />}
                    {trend.direction === 'down' && <TrendingDown size={14} />}
                    {trend.direction === 'neutral' && <Minus size={14} />}
                    {trend.percent}%
                </div>
            </div>

            {/* Chart */}
            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a3e635" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#a3e635" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatXAxis}
                            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                            axisLine={{ stroke: '#27272a' }}
                            tickLine={false}
                            tickCount={5}
                        />
                        <YAxis
                            tickFormatter={(v) => formatVolume(v)}
                            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#a3e635"
                            strokeWidth={2}
                            fill="url(#volumeGradient)"
                            animationDuration={800}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Subtitle */}
            <p className="text-[10px] font-mono text-zinc-600 text-center mt-2 uppercase tracking-wider">
                Daily Training Volume (Weight × Reps)
            </p>
        </div>
    );
};

export default VolumeChart;
