import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Dumbbell, ChevronDown } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { get1RMProgression, getMostUsedExercises } from '../../utils/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils'; // Assuming this exists, based on previous files

const OneRMProgress: React.FC = () => {
    const { history, exercises } = useWorkoutStore();
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

    const data = useMemo(() => {
        if (!selectedExerciseId) return [];
        return get1RMProgression(history, selectedExerciseId);
    }, [history, selectedExerciseId]);

    const formatXAxis = (timestamp: number) => {
        const date = new Date(timestamp);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    const current1RM = data.length > 0 ? data[data.length - 1].value : 0;
    const previous1RM = data.length > 1 ? data[data.length - 2].value : current1RM; // Or 0?
    const growth = current1RM > 0 && previous1RM > 0
        ? ((current1RM - previous1RM) / previous1RM) * 100
        : 0;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg shadow-xl">
                    <p className="text-[10px] text-zinc-500 font-mono mb-1 uppercase">
                        {new Date(label).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-black text-brand-primary font-mono">
                        {payload[0].value} kg
                    </p>
                </div>
            );
        }
        return null;
    };

    if (topExercises.length === 0) return (
        <div className="h-full flex flex-col items-center justify-center text-zinc-700">
            <Dumbbell size={24} className="mb-2 opacity-50" />
            <span className="text-xs font-mono uppercase">Not enough data</span>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            {/* Control Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 text-sm font-bold text-white uppercase font-mono bg-zinc-800/50 px-3 py-1.5 rounded-[4px] hover:bg-zinc-800 transition-colors"
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
                                    className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-[4px] shadow-2xl z-20 overflow-hidden"
                                >
                                    {topExercises.map(ex => (
                                        <button
                                            key={ex.id}
                                            onClick={() => {
                                                setSelectedExerciseId(ex.id);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-xs font-mono font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 uppercase transition-colors border-b border-zinc-800 last:border-0"
                                        >
                                            {ex.name}
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <div className="text-right">
                    <div className="text-2xl font-black font-mono text-white leading-none">
                        {current1RM}<span className="text-xs text-zinc-600 ml-1">KG</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
                        <YAxis
                            tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }}
                            axisLine={false}
                            tickLine={false}
                            domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="url(#lineColor)"
                            strokeWidth={3}
                            dot={{ fill: '#18181b', stroke: '#a3e635', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#BEF264' }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default OneRMProgress;
