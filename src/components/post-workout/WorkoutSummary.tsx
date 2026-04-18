import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Clock, Dumbbell, Flame, TrendingUp, TrendingDown,
    ChevronRight, Camera, X, Zap, Target
} from 'lucide-react';
import { Session, MuscleGroup, Exercise } from '../../types';
import MuscleOverlay from '../progress/MuscleOverlay';
import { getSessionMuscleIntensity } from '../../utils/analytics';
import { calculateACWR } from '../../utils/engine';
import ACWRCard from '../analytics/ACWRCard';
import { cn } from '../../lib/utils';

interface WorkoutSummaryProps {
    session: Session;
    muscleGroups: MuscleGroup[];
    exercises: Map<string, Exercise>;
    previousSession?: Session | null;
    history?: Session[];  // A-02: full history for ACWR calc
    onContinue: () => void;
    onDismiss: () => void;
}

// Animated counter that rolls up from 0
const AnimatedNumber: React.FC<{ value: number; duration?: number; suffix?: string; prefix?: string }> = ({
    value, duration = 1200, suffix = '', prefix = ''
}) => {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (value === 0) { setDisplay(0); return; }
        let rafId: number;
        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(value * eased));
            if (progress < 1) {
                rafId = requestAnimationFrame(tick);
            }
        };
        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [value, duration]);

    return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
};

// Format duration from ms to "1h 23m" or "45m"
const formatDuration = (ms: number): string => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
    session, muscleGroups, exercises, previousSession, history = [], onContinue, onDismiss
}) => {
    const [showConfetti, setShowConfetti] = useState(false);

    // Compute stats
    const stats = useMemo(() => {
        const completedSets = session.sets.filter(s => s.isCompleted);
        const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
        const totalSets = completedSets.length;
        const totalReps = completedSets.reduce((sum, s) => sum + s.reps, 0);
        const prs = completedSets.filter(s => s.isPR);
        const duration = session.sets.length > 0
            ? (Math.max(...session.sets.map(s => s.timestamp)) - session.date)
            : 0;

        // Unique exercises
        const uniqueExercises = new Set(completedSets.map(s => s.exerciseId)).size;

        // Top exercise by volume
        const exerciseVolumes = new Map<string, number>();
        completedSets.forEach(s => {
            const vol = (exerciseVolumes.get(s.exerciseId) || 0) + (s.weight * s.reps);
            exerciseVolumes.set(s.exerciseId, vol);
        });
        let topExerciseId = '';
        let topExerciseVol = 0;
        exerciseVolumes.forEach((vol, id) => {
            if (vol > topExerciseVol) { topExerciseVol = vol; topExerciseId = id; }
        });
        const topExercise = exercises.get(topExerciseId);

        return {
            totalVolume, totalSets, totalReps, prs, duration,
            uniqueExercises, topExercise, topExerciseVol
        };
    }, [session, exercises]);

    // Comparison with previous session
    const comparison = useMemo(() => {
        if (!previousSession) return null;
        const prevCompletedSets = previousSession.sets.filter(s => s.isCompleted);
        const prevVolume = prevCompletedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
        const prevSets = prevCompletedSets.length;

        if (prevVolume === 0) return null;

        const volumeDiff = stats.totalVolume - prevVolume;
        const volumePercent = Math.round((volumeDiff / prevVolume) * 100);
        const setDiff = stats.totalSets - prevSets;

        return { volumeDiff, volumePercent, setDiff };
    }, [previousSession, stats]);

    // Trigger confetti if PRs
    useEffect(() => {
        if (stats.prs.length > 0) {
            setTimeout(() => setShowConfetti(true), 800);
        }
    }, [stats.prs.length]);

    // A-02: ACWR from history including this session
    const acwr = useMemo(() => {
        if (history.length < 2) return null;
        const simulatedSession = { ...session, volumeLoad: stats.totalVolume, isCompleted: true };
        return calculateACWR([...history, simulatedSession]);
    }, [history, session, stats.totalVolume]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
        >
            {/* Confetti particles for PR */}
            <AnimatePresence>
                {showConfetti && (
                    <>
                        {Array.from({ length: 20 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: '50%', y: '40%', scale: 0, opacity: 1
                                }}
                                animate={{
                                    x: `${20 + Math.random() * 60}%`,
                                    y: `${10 + Math.random() * 80}%`,
                                    scale: [0, 1, 0.5],
                                    opacity: [1, 1, 0],
                                    rotate: Math.random() * 360
                                }}
                                transition={{
                                    duration: 1.5 + Math.random(),
                                    delay: Math.random() * 0.3,
                                    ease: 'easeOut'
                                }}
                                className="fixed w-2 h-2 pointer-events-none z-[100]"
                                style={{
                                    backgroundColor: ['#bef264', '#facc15', '#f472b6', '#60a5fa', '#a78bfa'][
                                        Math.floor(Math.random() * 5)
                                    ]
                                }}
                            />
                        ))}
                    </>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 overflow-hidden relative"
            >
                {/* Close button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-4 right-4 z-10 p-1.5 text-zinc-600 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-zinc-800/50">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.3 }}
                        className="w-12 h-12 bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center mb-3"
                    >
                        <Trophy size={24} className="text-brand-primary" />
                    </motion.div>
                    <h2 className="font-mono text-xl font-black text-white uppercase tracking-wider">
                        Workout Complete
                    </h2>
                    <p className="font-mono text-[10px] text-zinc-500 mt-1 uppercase">
                        {session.name || 'Free Session'} • {new Date(session.date).toLocaleDateString()}
                    </p>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-px bg-zinc-800/30 border-b border-zinc-800/50">
                    {/* Duration */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-zinc-950 p-4"
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <Clock size={12} className="text-zinc-500" />
                            <span className="font-mono text-[9px] text-zinc-500 uppercase font-bold">Duration</span>
                        </div>
                        <div className="font-mono text-2xl font-black text-white">
                            {formatDuration(stats.duration)}
                        </div>
                    </motion.div>

                    {/* Volume */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-zinc-950 p-4"
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <Dumbbell size={12} className="text-zinc-500" />
                            <span className="font-mono text-[9px] text-zinc-500 uppercase font-bold">Volume</span>
                        </div>
                        <div className="font-mono text-2xl font-black text-white">
                            <AnimatedNumber
                                value={stats.totalVolume}
                                suffix={stats.totalVolume >= 1000 ? '' : 'kg'}
                                prefix=""
                            />
                            {stats.totalVolume >= 1000 && (
                                <span className="text-sm text-zinc-400">kg</span>
                            )}
                        </div>
                        {/* Comparison badge */}
                        {comparison && (
                            <motion.div
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.5 }}
                                className={cn(
                                    "flex items-center gap-0.5 mt-1 font-mono text-[10px] font-bold",
                                    comparison.volumePercent >= 0 ? "text-brand-primary" : "text-red-400"
                                )}
                            >
                                {comparison.volumePercent >= 0
                                    ? <TrendingUp size={10} />
                                    : <TrendingDown size={10} />
                                }
                                {comparison.volumePercent >= 0 ? '+' : ''}{comparison.volumePercent}% vs last
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Sets */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-zinc-950 p-4"
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <Target size={12} className="text-zinc-500" />
                            <span className="font-mono text-[9px] text-zinc-500 uppercase font-bold">Sets</span>
                        </div>
                        <div className="font-mono text-2xl font-black text-white">
                            <AnimatedNumber value={stats.totalSets} />
                        </div>
                        {comparison && comparison.setDiff !== 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.6 }}
                                className={cn(
                                    "font-mono text-[10px] font-bold mt-1",
                                    comparison.setDiff > 0 ? "text-brand-primary" : "text-red-400"
                                )}
                            >
                                {comparison.setDiff > 0 ? '+' : ''}{comparison.setDiff} sets
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Exercises */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-zinc-950 p-4"
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <Zap size={12} className="text-zinc-500" />
                            <span className="font-mono text-[9px] text-zinc-500 uppercase font-bold">Exercises</span>
                        </div>
                        <div className="font-mono text-2xl font-black text-white">
                            <AnimatedNumber value={stats.uniqueExercises} />
                        </div>
                    </motion.div>
                </div>

                {/* PRs Section */}
                {stats.prs.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ delay: 0.8 }}
                        className="px-6 py-4 border-b border-zinc-800/50 bg-brand-primary/5"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Flame size={14} className="text-brand-primary" />
                            <span className="font-mono text-xs font-black text-brand-primary uppercase">
                                {stats.prs.length} Personal Record{stats.prs.length > 1 ? 's' : ''}!
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            {stats.prs.slice(0, 3).map((pr, i) => {
                                const ex = exercises.get(pr.exerciseId);
                                return (
                                    <motion.div
                                        key={pr.id}
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.15 }}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="font-mono text-[11px] text-zinc-300 truncate mr-2">
                                            {ex?.name || 'Exercise'}
                                        </span>
                                        <span className="font-mono text-[11px] font-bold text-white whitespace-nowrap">
                                            {pr.weight}kg × {pr.reps}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Muscle Groups */}
                {muscleGroups.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="px-6 py-4 border-b border-zinc-800/50 flex items-center gap-4"
                    >
                        <MuscleOverlay
                            muscleGroups={muscleGroups}
                            volumes={useMemo(() => getSessionMuscleIntensity(session, Array.from(exercises.values())), [session, exercises])}
                            size={64}
                        />
                        <div className="flex-1">
                            <span className="font-mono text-[9px] text-zinc-500 uppercase font-bold block mb-2">
                                Muscles Trained
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {muscleGroups.map(mg => (
                                    <span
                                        key={mg}
                                        className="px-2 py-0.5 bg-brand-primary/10 border border-brand-primary/20 font-mono text-[9px] text-brand-primary uppercase font-black"
                                    >
                                        {mg}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* A-02: ACWR Readiness */}
                {acwr && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="px-6 py-4 border-b border-zinc-800/50"
                    >
                        <ACWRCard
                            ratio={acwr.ratio}
                            acute={acwr.acute}
                            chronic={acwr.chronic}
                            risk={acwr.risk}
                            compact
                        />
                    </motion.div>
                )}

                {/* Actions */}
                <div className="flex">
                    <button
                        onClick={onDismiss}
                        className="flex-1 px-4 py-4 font-mono text-sm text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors text-center"
                    >
                        Done
                    </button>
                    <div className="w-px bg-zinc-800" />
                    <button
                        onClick={onContinue}
                        className="flex-1 px-4 py-4 bg-brand-primary font-mono text-sm font-black text-black flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                    >
                        <Camera size={16} />
                        <span>Take Photo</span>
                        <ChevronRight size={14} />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default WorkoutSummary;
