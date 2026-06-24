import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, CheckCircle2, Flame } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { cn } from '../../lib/utils';

type ChallengeType = 'sessions' | 'volume' | 'sets';

interface Challenge {
    type: ChallengeType;
    label: string;
    goal: number;
    unit: string;
    icon: React.ReactNode;
}

const CHALLENGE_OPTIONS: Challenge[] = [
    { type: 'sessions', label: 'Session Streak', goal: 4, unit: 'workouts', icon: <Flame size={14} className="text-orange-400" /> },
    { type: 'volume', label: 'Volume Bomb', goal: 20000, unit: 'kg total', icon: <Zap size={14} className="text-yellow-400" /> },
    { type: 'sets', label: 'Set Grinder', goal: 50, unit: 'sets', icon: <Target size={14} className="text-blue-400" /> },
];

function getThisWeekRange(): [number, number] {
    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dow + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return [monday.getTime(), sunday.getTime()];
}

const WeeklyChallenge: React.FC = () => {
    const { history } = useWorkoutStore();
    const [selected, setSelected] = useState<ChallengeType>('sessions');

    const [start, end] = getThisWeekRange();

    const weekSessions = useMemo(
        () => history.filter(s => s.isCompleted && !s.deletedAt && s.date >= start && s.date <= end),
        [history, start, end]
    );

    const progress = useMemo(() => {
        switch (selected) {
            case 'sessions':
                return weekSessions.length;
            case 'volume':
                return Math.round(weekSessions.reduce((sum, s) => sum + (s.volumeLoad || 0), 0));
            case 'sets':
                return weekSessions.reduce((sum, s) => sum + s.sets.filter(ws => !ws.type || ws.type === 'working').length, 0);
        }
    }, [selected, weekSessions]);

    const challenge = CHALLENGE_OPTIONS.find(c => c.type === selected)!;
    const pct = Math.min(100, Math.round((progress / challenge.goal) * 100));
    const done = pct >= 100;

    // Weekly day markers (Mon–Sun)
    const dayDots = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const dayStart = d.getTime();
            const dayEnd = dayStart + 86400000 - 1;
            const hasSession = weekSessions.some(s => s.date >= dayStart && s.date <= dayEnd);
            return { label: ['M','T','W','T','F','S','S'][i], hasSession };
        });
    }, [weekSessions, start]);

    const weekLabel = useMemo(() => {
        const s = new Date(start);
        const e = new Date(end);
        return `${s.getDate()}/${s.getMonth() + 1} – ${e.getDate()}/${e.getMonth() + 1}`;
    }, [start, end]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Flame size={14} className="text-orange-400" />
                    <span className="text-caption-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Weekly Challenge
                    </span>
                </div>
                <span className="text-caption-xs font-medium text-zinc-600">{weekLabel}</span>
            </div>

            {/* Challenge selector */}
            <div className="flex gap-2">
                {CHALLENGE_OPTIONS.map(c => (
                    <button
                        key={c.type}
                        onClick={() => setSelected(c.type)}
                        className={cn(
                            'flex-1 py-2 px-1 rounded-lg border text-caption-xs font-bold uppercase transition-all text-center',
                            selected === c.type
                                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                                : 'border-zinc-800 text-zinc-600 hover:border-zinc-700'
                        )}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Progress card */}
            <motion.div
                key={selected}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    'p-5 rounded-xl border transition-all',
                    done ? 'border-brand-success/40 bg-brand-success/5' : 'border-zinc-800 bg-zinc-900/50'
                )}
            >
                <div className="flex items-center gap-3 mb-4">
                    {challenge.icon}
                    <div className="flex-1">
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs font-bold text-white">{challenge.label}</span>
                            {done && <CheckCircle2 size={14} className="text-brand-success" />}
                        </div>
                        <div className="text-caption-xs font-medium text-zinc-500 mt-0.5">
                            Goal: {challenge.goal.toLocaleString()} {challenge.unit}
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-lg font-bold text-white">
                            {progress.toLocaleString()}
                            <span className="text-sm text-zinc-500 ml-1 font-normal">{challenge.unit}</span>
                        </span>
                        <span className={cn(
                            'text-sm font-bold',
                            done ? 'text-brand-success' : 'text-zinc-400'
                        )}>
                            {pct}%
                        </span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={cn(
                                'h-full rounded-full',
                                done ? 'bg-brand-success' : 'bg-brand-primary'
                            )}
                        />
                    </div>
                </div>

                {done && (
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="text-center text-caption-xs font-bold text-brand-success mt-3"
                    >
                        🎉 Challenge Complete!
                    </motion.div>
                )}
            </motion.div>

            {/* Daily activity dots */}
            <div>
                <div className="text-caption-xs font-bold text-zinc-600 uppercase tracking-widest mb-2">This Week</div>
                <div className="flex gap-2 justify-between">
                    {dayDots.map((d, i) => {
                        const today = new Date();
                        const dayDate = new Date(start);
                        dayDate.setDate(dayDate.getDate() + i);
                        const isToday = dayDate.toDateString() === today.toDateString();
                        const isPast = dayDate < today && !isToday;

                        return (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center border transition-all',
                                    d.hasSession
                                        ? 'bg-brand-primary border-brand-primary text-black'
                                        : isToday
                                        ? 'border-brand-primary/50 text-brand-primary'
                                        : isPast
                                        ? 'border-zinc-800 text-zinc-700'
                                        : 'border-zinc-800/50 text-zinc-800'
                                )}>
                                    {d.hasSession
                                        ? <CheckCircle2 size={14} />
                                        : <span className="text-caption-xs font-bold">{d.label}</span>
                                    }
                                </div>
                                <span className={cn(
                                    'text-caption-xs font-medium',
                                    isToday ? 'text-brand-primary' : 'text-zinc-700'
                                )}>
                                    {d.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WeeklyChallenge;
