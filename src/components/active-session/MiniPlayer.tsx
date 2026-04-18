import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { Maximize2, Timer, Dumbbell } from 'lucide-react';
import { cn } from '../../lib/utils';

/** U-02 — Enhanced MiniPlayer with current exercise, set progress, and completion ring. */
export const MiniPlayer = () => {
    const { activeSession, toggleMinimize, restTimer, exercises } = useWorkoutStore();
    const [duration, setDuration] = useState('0:00');
    const [restRemaining, setRestRemaining] = useState(0);

    // Duration Timer
    useEffect(() => {
        if (!activeSession) return;
        const interval = setInterval(() => {
            const diff = Math.floor((Date.now() - activeSession.date) / 1000);
            const m = Math.floor(diff / 60);
            const s = diff % 60;
            setDuration(`${m}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [activeSession]);

    // Rest Timer
    useEffect(() => {
        if (!restTimer.endTime) { setRestRemaining(0); return; }
        const interval = setInterval(() => {
            const left = Math.ceil((restTimer.endTime! - Date.now()) / 1000);
            setRestRemaining(left <= 0 ? 0 : left);
        }, 500);
        return () => clearInterval(interval);
    }, [restTimer.endTime]);

    // Session progress data
    const sessionInfo = useMemo(() => {
        if (!activeSession) return null;
        const allSets = activeSession.sets;
        const completed = allSets.filter(s => s.isCompleted).length;
        const total = allSets.length;

        // Current (first incomplete) exercise
        const firstIncompleteSet = allSets.find(s => !s.isCompleted);
        const currentExercise = firstIncompleteSet
            ? exercises.find(e => e.id === firstIncompleteSet.exerciseId)
            : null;

        const progressPct = total > 0 ? (completed / total) : 0;
        return { completed, total, currentExercise, progressPct };
    }, [activeSession, exercises]);

    if (!activeSession || !sessionInfo) return null;

    const isResting = restRemaining > 0;
    const restProgress = isResting && restTimer.originalDuration > 0
        ? (restRemaining / restTimer.originalDuration) * 100
        : 0;

    // SVG ring values
    const RING_R = 20;
    const RING_C = 2 * Math.PI * RING_R;
    const ringOffset = RING_C * (1 - sessionInfo.progressPct);

    return (
        <motion.div
            initial={{ y: 150, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 150, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-[90px] left-4 right-4 z-40 flex justify-center pointer-events-none"
        >
            <div
                onClick={() => toggleMinimize(false)}
                className="w-full max-w-lg md:max-w-2xl pointer-events-auto cursor-pointer group"
            >
                <div className="relative overflow-hidden bg-black/85 backdrop-blur-xl border border-white/10 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] px-4 py-3 flex items-center justify-between gap-4">

                    {/* Rest progress bar at bottom edge */}
                    {isResting && (
                        <motion.div
                            className="absolute bottom-0 left-0 h-[2px] bg-brand-primary z-20"
                            initial={{ width: '100%' }}
                            animate={{ width: `${restProgress}%` }}
                            transition={{ ease: 'linear', duration: 0.5 }}
                        />
                    )}

                    {/* Left: icon with progress ring */}
                    <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                            <circle cx="24" cy="24" r={RING_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                            <circle
                                cx="24" cy="24" r={RING_R}
                                fill="none"
                                stroke={isResting ? '#f59e0b' : '#bef264'}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeDasharray={RING_C}
                                strokeDashoffset={ringOffset}
                                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                            />
                        </svg>
                        <div className={cn(
                            "relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            isResting ? "text-amber-400" : "text-white"
                        )}>
                            {isResting ? <Timer size={16} /> : <Dumbbell size={16} />}
                        </div>
                    </div>

                    {/* Center: exercise + timer */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn(
                                "text-[9px] font-mono font-black uppercase tracking-widest",
                                isResting ? "text-amber-400" : "text-brand-primary"
                            )}>
                                {isResting
                                    ? `Rest ${Math.floor(restRemaining / 60)}:${String(restRemaining % 60).padStart(2, '0')}`
                                    : duration}
                            </span>
                            <span className="text-[8px] font-mono text-zinc-600">
                                {sessionInfo.completed}/{sessionInfo.total} sets
                            </span>
                        </div>
                        <p className="text-white font-bold text-sm leading-tight truncate">
                            {sessionInfo.currentExercise?.name
                                ?? (sessionInfo.completed === sessionInfo.total && sessionInfo.total > 0
                                    ? '✓ All sets done'
                                    : activeSession.name ?? 'Workout')}
                        </p>
                    </div>

                    {/* Right: expand */}
                    <div className="shrink-0 pl-3 border-l border-white/10">
                        <button className="w-9 h-9 rounded-full bg-white/5 hover:bg-brand-primary/20 flex items-center justify-center text-zinc-400 hover:text-brand-primary transition-colors group-active:scale-95">
                            <Maximize2 size={17} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};