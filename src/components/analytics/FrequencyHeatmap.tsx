import React, { useMemo, useState } from 'react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getFrequencyHeatmap } from '../../utils/analytics';
import { Calendar as CalendarIcon, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import EmptyState from '../ui/EmptyState';

interface DayDetail {
    date: string;
    count: number;
    sessions: { name: string; volumeLoad: number; date: number }[];
}

/**
 * A-05 — Training frequency heatmap (90 days) with drill-down by day.
 * Clicking a day shows which sessions were logged that day.
 */
const FrequencyHeatmap: React.FC = () => {
    const history = useWorkoutStore(state => state.history);
    const [selected, setSelected] = useState<DayDetail | null>(null);

    const data = useMemo(() => getFrequencyHeatmap(history), [history]);

    const hasData = useMemo(() => data.some(d => d.count > 0), [data]);

    // Build a richer map with session names for drill-down
    const dayMap = useMemo(() => {
        const map = new Map<string, { name: string; volumeLoad: number; date: number }[]>();
        history.filter(s => s.isCompleted && !s.deletedAt).forEach(s => {
            const key = new Date(s.date).toISOString().split('T')[0];
            const list = map.get(key) || [];
            list.push({ name: s.name || 'Workout', volumeLoad: s.volumeLoad, date: s.date });
            map.set(key, list);
        });
        return map;
    }, [history]);

    // Group days into weeks (7 cols) for the grid layout
    const weeks = useMemo(() => {
        const result: typeof data[0][][] = [];
        for (let i = 0; i < data.length; i += 7) {
            result.push(data.slice(i, i + 7));
        }
        return result;
    }, [data]);

    const handleDayClick = (point: typeof data[0]) => {
        if (point.count === 0) return;
        const sessions = dayMap.get(point.date) || [];
        setSelected({ date: point.date, count: point.count, sessions });
    };

    const colorForCount = (count: number) => {
        if (count === 0) return 'bg-zinc-900 border border-zinc-800/50 cursor-default';
        if (count === 1) return 'bg-lime-900/60 border border-lime-800/40 cursor-pointer hover:brightness-125';
        if (count === 2) return 'bg-lime-700/70 border border-lime-600/40 cursor-pointer hover:brightness-125';
        return 'bg-brand-primary/80 border border-brand-primary/50 shadow-[0_0_6px_rgba(190,242,100,0.3)] cursor-pointer hover:brightness-125';
    };

    if (!hasData) {
        return (
            <div className="h-[160px] flex items-center justify-center">
                <EmptyState
                    icon={CalendarIcon}
                    title="No Training Data"
                    description="Consistency is key. Log workouts to see your streak."
                />
            </div>
        );
    }

    return (
        <div>
            {/* Day-of-week labels */}
            <div className="flex gap-1 mb-1 pl-0">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="w-[10px] text-center text-[7px] text-zinc-700 font-bold">
                        {d}
                    </div>
                ))}
            </div>

            {/* Heatmap grid — weeks as rows */}
            <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-1 min-w-max">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-1">
                            {week.map((point) => (
                                <motion.button
                                    key={point.date}
                                    whileHover={point.count > 0 ? { scale: 1.3 } : {}}
                                    onClick={() => handleDayClick(point)}
                                    title={`${point.date}: ${point.count} session${point.count !== 1 ? 's' : ''}`}
                                    className={cn('w-[10px] h-[10px] rounded-[2px] transition-all', colorForCount(point.count))}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end">
                <span className="text-[8px] text-zinc-700 font-mono">Less</span>
                {[0, 1, 2, 3].map(v => (
                    <div key={v} className={cn('w-[8px] h-[8px] rounded-[2px]', colorForCount(v).split(' ')[0])} />
                ))}
                <span className="text-[8px] text-zinc-700 font-mono">More</span>
            </div>

            {/* Drill-down panel */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 overflow-hidden"
                    >
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-zinc-300 font-mono flex items-center gap-1">
                                    <CalendarIcon size={10} className="text-brand-primary" />
                                    {new Date(selected.date).toLocaleDateString(undefined, {
                                        weekday: 'short', month: 'short', day: 'numeric'
                                    })}
                                </span>
                                <button onClick={() => setSelected(null)} className="text-zinc-600 hover:text-zinc-400">
                                    <X size={12} />
                                </button>
                            </div>
                            <div className="space-y-1.5">
                                {selected.sessions.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-[10px] text-white font-bold truncate mr-2">{s.name}</span>
                                        <span className="text-[9px] text-zinc-500 font-mono shrink-0">
                                            {s.volumeLoad > 1000 ? `${(s.volumeLoad / 1000).toFixed(1)}k` : s.volumeLoad} kg
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FrequencyHeatmap;
