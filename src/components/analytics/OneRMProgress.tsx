import React, { useState, useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { TooltipProps } from 'recharts';
import { TrendingUp, Dumbbell, ChevronDown } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { get1RMProgression, getRPEProgression, getMostUsedExercises } from '../../utils/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const OneRMProgress: React.FC = () => {
    const history = useWorkoutStore(state => state.history);
    const exercises = useWorkoutStore(state => state.exercises);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Get top exercises for the dropdown
    const topExercises = useMemo(() => {
        return getMostUsedExercises(history, exercises, 5).map(e => e.exercise);
    }, [history, exercises]);

    // Set default selected exercise if none selected
    React.useEffect(() => {
        if (!selectedExerciseId && topExercises.length > 0) {
            setSelectedExerciseId(topExercises[0].id);
        }
    }, [topExercises, selectedExerciseId]);

    const selectedExercise = useMemo(() =>
        exercises.find(e => e.id === selectedExerciseId),
        [exercises, selectedExerciseId]);

    const oneRMData = useMemo(() => {
        if (!selectedExerciseId) return [];
        return get1RMProgression(history, selectedExerciseId);
    }, [history, selectedExerciseId]);

    const rpeData = useMemo(() => {
        if (!selectedExerciseId) return [];
        return getRPEProgression(history, selectedExerciseId);
    }, [history, selectedExerciseId]);

    // Merge 1RM and RPE series by date key so both lines share the same x-axis points
    const data = useMemo(() => {
        const map = new Map<number, { date: number; value?: number; rpe?: number }>();
        oneRMData.forEach(p => map.set(p.date, { date: p.date, value: p.value }));
        rpeData.forEach(p => {
            const existing = map.get(p.date);
            if (existing) existing.rpe = p.value;
            else map.set(p.date, { date: p.date, rpe: p.value });
        });
        return Array.from(map.values()).sort((a, b) => a.date - b.date);
    }, [oneRMData, rpeData]);

    const formatXAxis = (timestamp: number) => {
        const date = new Date(timestamp);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    const current1RM = oneRMData.length > 0 ? oneRMData[oneRMData.length - 1].value : 0;

    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            const rm = payload.find(p => p.dataKey === 'value');
            const rpe = payload.find(p => p.dataKey === 'rpe');
            return (
                <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg shadow-xl">
                    <p className="text-caption-xs text-zinc-500 font-medium mb-1 uppercase">
                        {new Date(label).toLocaleDateString()}
                    </p>
                    {rm && (
                        <p className="text-sm font-bold text-brand-primary">
                            {rm.value} kg <span className="text-zinc-500 font-normal text-caption-xs">e1RM</span>
                        </p>
                    )}
                    {rpe && (
                        <p className="text-xs font-bold text-amber-400">
                            RPE {rpe.value}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    if (topExercises.length === 0) return (
        <div className="h-full flex flex-col items-center justify-center text-zinc-700">
            <Dumbbell size={24} className="mb-2 opacity-50" />
            <span className="text-xs font-medium uppercase">Not enough data</span>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            {/* Control Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 text-sm font-bold text-white uppercase font-medium bg-zinc-800/50 px-3 py-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                        {selectedExercise?.name || 'Select Exercise'}
                        <ChevronDown size={14} className={cn("transition-transform", isDropdownOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-20 overflow-hidden"
                                >
                                    {topExercises.map(ex => (
                                        <button
                                            key={ex.id}
                                            onClick={() => {
                                                setSelectedExerciseId(ex.id);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 uppercase transition-colors border-b border-zinc-800 last:border-0"
                                        >
                                            {ex.name}
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-3">
                    {/* RPE legend dot */}
                    {rpeData.length > 0 && (
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="text-caption-xs font-medium text-zinc-500 uppercase">RPE</span>
                        </div>
                    )}
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white leading-none">
                            {current1RM}<span className="text-xs text-zinc-600 ml-1">KG</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#3f3f46" />
                                <stop offset="100%" stopColor="#a3e635" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatXAxis}
                            tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        {/* Left axis: e1RM (kg) */}
                        <YAxis
                            yAxisId="rm"
                            tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }}
                            axisLine={false}
                            tickLine={false}
                            domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        {/* Right axis: RPE (1-10) — only rendered when RPE data exists */}
                        {rpeData.length > 0 && (
                            <YAxis
                                yAxisId="rpe"
                                orientation="right"
                                domain={[5, 10]}
                                tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }}
                                axisLine={false}
                                tickLine={false}
                                tickCount={4}
                            />
                        )}
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            yAxisId="rm"
                            type="monotone"
                            dataKey="value"
                            stroke="url(#lineColor)"
                            strokeWidth={3}
                            dot={{ fill: '#18181b', stroke: '#a3e635', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#BEF264' }}
                            animationDuration={1500}
                            connectNulls
                        />
                        {rpeData.length > 0 && (
                            <Line
                                yAxisId="rpe"
                                type="monotone"
                                dataKey="rpe"
                                stroke="#fbbf24"
                                strokeWidth={1.5}
                                strokeDasharray="4 3"
                                dot={false}
                                activeDot={{ r: 4, fill: '#fbbf24' }}
                                animationDuration={1500}
                                connectNulls
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default OneRMProgress;
