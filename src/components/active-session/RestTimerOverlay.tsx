import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, SkipForward, Minus, ChevronsRight, RotateCcw } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useHaptic } from '../../hooks/useHaptic';
import { audio } from '../../utils/audio';
import { cn } from '../../lib/utils';

export const RestTimerOverlay = () => {
    const { restTimer, skipRest, addRestTime, userStats, activeSession, exercises } = useWorkoutStore();
    const { trigger: haptic } = useHaptic();
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!restTimer.endTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.ceil((restTimer.endTime! - now) / 1000);

            if (remaining <= 0) {
                if (userStats.isAudioEnabled !== false) audio.playTimerFinished();
                if (userStats.isVibrationEnabled !== false) haptic('timer');
                skipRest(); // Auto close on finish
            } else {
                setTimeLeft(remaining);
            }
        }, 200);

        return () => clearInterval(interval);
    }, [restTimer.endTime, skipRest]);

    // 3s Audio Countdown
    useEffect(() => {
        if (timeLeft > 0 && timeLeft <= 3) {
            if (userStats.isAudioEnabled !== false) audio.playTimerCountdown();
            if (userStats.isVibrationEnabled !== false) haptic('light');
        }
    }, [timeLeft]);

    if (!restTimer.isRunning || !restTimer.endTime) return null;

    const progress = Math.min(100, (timeLeft / restTimer.originalDuration) * 100);
    const isCritical = timeLeft <= 10;

    // "Next Up" Logic
    const nextSet = activeSession?.sets.find(s => !s.isCompleted);
    const nextExercise = nextSet ? exercises.find(e => e.id === nextSet.exerciseId) : null;
    const remainingSets = nextExercise ? activeSession?.sets.filter(s => s.exerciseId === nextExercise.id && !s.isCompleted).length : 0;

    // Helper for quick adjust buttons
    const AdjustButton = ({ seconds, label }: { seconds: number, label: string }) => (
        <button
            onClick={() => {
                if (userStats.isVibrationEnabled !== false && navigator.vibrate) navigator.vibrate(10);
                addRestTime(seconds);
            }}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-zinc-800 border border-white/5 active:bg-zinc-700 tap"
        >
            <span className={cn("text-xs font-bold", seconds > 0 ? "text-brand-success" : "text-brand-danger")}>
                {seconds > 0 ? '+' : ''}{seconds}
            </span>
            <span className="text-caption-xs text-zinc-500 uppercase font-medium">Sec</span>
        </button>
    );

    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-modal bg-zinc-950 border-t border-white/10 rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] overflow-hidden pb-safe"
        >
            {/* Progress Bar Background */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900">
                <motion.div
                    className={cn(
                        "h-full shadow-[0_0_15px_currentColor]",
                        isCritical ? "bg-red-500 text-red-500" : "bg-brand-primary text-brand-primary"
                    )}
                    initial={{ width: "100%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 0.2 }}
                />
            </div>

            <div className="p-6 flex flex-col items-center relative z-10">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4 opacity-50">
                    <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Rest In Progress</span>
                </div>

                    {/* Main Timer Display */}
                <time
                    aria-live="polite"
                    dateTime={`PT${timeLeft}S`}
                    className="text-7xl font-bold text-white mb-8 tabular-nums tracking-tight relative"
                >
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </time>

                {/* Controls Container */}
                <div className="w-full max-w-sm space-y-6">

                    {/* Next Up Card */}
                    <AnimatePresence>
                        {nextExercise && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 p-3 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/5 mb-2"
                            >
                                <div className="w-10 h-10 rounded-xl bg-black overflow-hidden shrink-0 border border-white/10">
                                    <img src={nextExercise.staticImageUrl || (nextExercise.gifUrl ? `https://wsrv.nl/?url=${encodeURIComponent(nextExercise.gifUrl)}&n=1&output=png` : '')} className="w-full h-full object-cover opacity-80 aspect-square" loading="lazy" alt="" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-caption-xs font-bold text-brand-primary uppercase tracking-widest">Next Up</p>
                                    <p className="text-sm font-bold text-white truncate">{nextExercise.name}</p>
                                </div>
                                <div className="text-right shrink-0 pr-2">
                                    <p className="text-xs font-bold text-zinc-400">{remainingSets} sets</p>
                                    <p className="text-caption-xs font-medium text-zinc-500 uppercase tracking-wider">Left</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Time Adjustment Grid */}
                    <div className="flex justify-between items-center px-4 gap-4">
                        <AdjustButton seconds={-30} label="-30" />
                        <AdjustButton seconds={-10} label="-10" />
                        <div className="w-px h-10 bg-white/10" />
                        <AdjustButton seconds={10} label="+10" />
                        <AdjustButton seconds={30} label="+30" />
                    </div>

                    {/* Main Action */}
                    <button
                        onClick={() => {
                            if (userStats.isVibrationEnabled !== false && navigator.vibrate) navigator.vibrate(20);
                            skipRest();
                        }}
                        className="w-full py-4 bg-white text-black font-bold text-lg rounded-2xl shadow-lg flex items-center justify-center gap-2 tap"
                    >
                        <ChevronsRight size={24} className="text-black" />
                        SKIP REST
                    </button>
                </div>
            </div>
        </motion.div>
    );
};