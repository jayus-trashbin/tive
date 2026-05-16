import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Clock, Dumbbell, Flame, TrendingUp, TrendingDown,
    ChevronRight, Camera, X, Zap, Target, AlertTriangle, Info
} from 'lucide-react';
import { Session, MuscleGroup, Exercise } from '../../types';
import { useCoachInsight } from '../../hooks/useCoachInsight';
import MuscleOverlay from '../progress/MuscleOverlay';
import { getSessionMuscleIntensity } from '../../utils/analytics';
import { calculateACWR } from '../../utils/engine';
import { calculateHybrid1RM } from '../../utils/formulas';
import ACWRCard from '../analytics/ACWRCard';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../i18n';

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
    if (totalMinutes === 0) return "< 1m";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
    session, muscleGroups, exercises, previousSession, history = [], onContinue, onDismiss
}) => {
    const { t } = useTranslation();
    const [showConfetti, setShowConfetti] = useState(false);
    const insights = useCoachInsight(session);

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

    // U-01: Per-exercise volume & e1RM comparison vs previousSession
    const perExerciseDelta = useMemo(() => {
        if (!previousSession) return [];
        
        type ExStats = { vol: number; maxE1RM: number };
        const current = new Map<string, ExStats>();
        const prev = new Map<string, ExStats>();

        session.sets.filter(s => s.isCompleted).forEach(s => {
            const stats = current.get(s.exerciseId) || { vol: 0, maxE1RM: 0 };
            const e1rm = calculateHybrid1RM(s.weight, s.reps, s.rpe);
            current.set(s.exerciseId, {
                vol: stats.vol + (s.weight * s.reps),
                maxE1RM: Math.max(stats.maxE1RM, e1rm)
            });
        });
        
        previousSession.sets.filter(s => s.isCompleted).forEach(s => {
            const stats = prev.get(s.exerciseId) || { vol: 0, maxE1RM: 0 };
            const e1rm = calculateHybrid1RM(s.weight, s.reps, s.rpe);
            prev.set(s.exerciseId, {
                vol: stats.vol + (s.weight * s.reps),
                maxE1RM: Math.max(stats.maxE1RM, e1rm)
            });
        });

        const ids = Array.from(new Set([...current.keys(), ...prev.keys()]));
        return ids.map(id => {
            const curr = current.get(id) || { vol: 0, maxE1RM: 0 };
            const p = prev.get(id) || { vol: 0, maxE1RM: 0 };
            
            const diff = curr.vol - p.vol;
            const pct = p.vol > 0 ? Math.round((diff / p.vol) * 100) : null;
            
            const e1rmDiff = curr.maxE1RM - p.maxE1RM;
            
            return { id, curr, prev: p, diff, pct, e1rmDiff };
        }).filter(d => d.curr.vol > 0 || d.prev.vol > 0)
          .sort((a, b) => b.curr.vol - a.curr.vol)
          .slice(0, 5);
    }, [session, previousSession]);

    // Compute Badges
    const badges = useMemo(() => {
        const b = [];
        if (comparison && comparison.volumePercent > 0) {
            b.push({ id: 'volume', icon: Flame, label: 'Volume PR', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' });
        }
        if (perExerciseDelta.some(d => d.e1rmDiff > 0)) {
            b.push({ id: 'intensity', icon: Zap, label: 'Intensity PR', color: 'text-brand-primary', bg: 'bg-brand-primary/10', border: 'border-brand-primary/20' });
        }
        return b;
    }, [comparison, perExerciseDelta]);

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

    // Check consistency badge
    useEffect(() => {
        if (acwr && acwr.ratio >= 0.8 && acwr.ratio <= 1.3 && badges.findIndex(b => b.id === 'consistency') === -1) {
            badges.push({ id: 'consistency', icon: Target, label: 'Consistent', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' });
        }
    }, [acwr, badges]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] bg-zinc-950 flex flex-col justify-between overflow-y-auto sm:p-4"
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
                className="w-full max-w-md mx-auto bg-zinc-950 sm:border sm:border-zinc-800 overflow-hidden relative min-h-screen sm:min-h-[90dvh] sm:rounded-2xl flex flex-col pointer-events-auto"
            >
                {/* Close button — High priority z-index and visibility */}
                <button
                    onClick={onDismiss}
                    className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-90 transition-all backdrop-blur-sm border border-zinc-800/50"
                    aria-label={t('common.close')}
                >
                    <X size={20} strokeWidth={2.5} />
                </button>

                {/* Hero Gradient Background */}
                <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-brand-primary/10 via-brand-primary/5 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="px-6 pt-12 pb-6 relative z-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.3 }}
                        className="w-14 h-14 bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center mb-4 rounded-2xl shadow-[0_0_24px_-4px] shadow-brand-primary/20"
                    >
                        <Trophy size={28} className="text-brand-primary" />
                    </motion.div>
                    <h2 className="text-4xl font-black text-white tracking-tight mb-2">
                        {t('workoutSummary.title')}
                    </h2>
                    <p className="text-[13px] font-medium text-zinc-400">
                        {session.name || t('workoutSummary.freeSession')} • {new Date(session.date).toLocaleDateString()}
                    </p>

                    {/* Badges Row */}
                    {badges.length > 0 && (
                        <div className="flex gap-2 mt-4 flex-wrap">
                            {badges.map((b, i) => (
                                <motion.div
                                    key={b.id}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 400 }}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider",
                                        b.bg, b.border, b.color
                                    )}
                                >
                                    <b.icon size={14} />
                                    {b.label}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Stats Grid - Bento Style */}
                <div className="grid grid-cols-2 gap-3 px-6 pb-6 relative z-10">
                    {/* Duration */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-zinc-900/50 backdrop-blur-md border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between"
                    >
                        <div className="flex items-center gap-1.5 mb-3 opacity-70">
                            <Clock size={16} className="text-brand-primary" />
                            <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Duration</span>
                        </div>
                        <div className="text-3xl font-black text-white">
                            {formatDuration(stats.duration)}
                        </div>
                    </motion.div>

                    {/* Volume */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-zinc-900/50 backdrop-blur-md border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between"
                    >
                        <div className="flex items-center gap-1.5 mb-3 opacity-70">
                            <Dumbbell size={16} className="text-brand-primary" />
                            <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Volume</span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-white flex items-baseline">
                                <AnimatedNumber
                                    value={stats.totalVolume}
                                    suffix={stats.totalVolume >= 1000 ? '' : 'kg'}
                                    prefix=""
                                />
                                {stats.totalVolume >= 1000 && (
                                    <span className="text-base text-zinc-400 font-bold ml-1">kg</span>
                                )}
                            </div>
                            {/* Comparison badge */}
                            {comparison && (
                                <motion.div
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.5 }}
                                    className={cn(
                                        "flex items-center gap-1 mt-1 font-bold text-xs",
                                        comparison.volumePercent >= 0 ? "text-brand-primary" : "text-red-400"
                                    )}
                                >
                                    {comparison.volumePercent >= 0
                                        ? <TrendingUp size={12} strokeWidth={3} />
                                        : <TrendingDown size={12} strokeWidth={3} />
                                    }
                                    {comparison.volumePercent >= 0 ? '+' : ''}{comparison.volumePercent}% vs last
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Sets */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-zinc-900/50 backdrop-blur-md border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between"
                    >
                        <div className="flex items-center gap-1.5 mb-3 opacity-70">
                            <Target size={16} className="text-brand-primary" />
                            <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Sets</span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-white">
                                <AnimatedNumber value={stats.totalSets} />
                            </div>
                            {comparison && comparison.setDiff !== 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.6 }}
                                    className={cn(
                                        "font-bold text-xs mt-1 flex items-center gap-1",
                                        comparison.setDiff > 0 ? "text-brand-primary" : "text-red-400"
                                    )}
                                >
                                    {comparison.setDiff > 0 ? '+' : ''}{comparison.setDiff} sets
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Exercises */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-zinc-900/50 backdrop-blur-md border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between"
                    >
                        <div className="flex items-center gap-1.5 mb-3 opacity-70">
                            <Zap size={16} className="text-brand-primary" />
                            <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Exercises</span>
                        </div>
                        <div className="text-3xl font-black text-white">
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
                            <Flame size={16} className="text-brand-primary" />
                            <span className="text-xs font-bold text-brand-primary uppercase tracking-wide">
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
                                        <span className="text-xs text-zinc-300 truncate mr-2 font-medium">
                                            {ex?.name || 'Exercise'}
                                        </span>
                                        <span className="text-xs font-bold text-white whitespace-nowrap">
                                            {pr.weight}kg × {pr.reps}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* U-01: Per-exercise comparison vs last session */}
                {perExerciseDelta.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ delay: 0.9 }}
                        className="px-6 py-4 border-b border-zinc-800/50"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={14} className="text-zinc-500" />
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">vs Last Session</span>
                        </div>
                        <div className="space-y-3">
                            {perExerciseDelta.map((d, i) => {
                                const ex = exercises.get(d.id);
                                const isUp = d.diff >= 0;
                                const isE1RMUp = d.e1rmDiff > 0;
                                
                                return (
                                    <motion.div
                                        key={d.id}
                                        initial={{ x: -8, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 1.1 + i * 0.08 }}
                                    >
                                        <div className="flex items-center gap-3 mb-2 bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/30">
                                            <span className="flex-1 font-bold text-xs text-white truncate">{ex?.name ?? d.id}</span>
                                            <div className="flex items-center gap-3">
                                                {/* Volume Delta */}
                                                <div className="flex flex-col items-end justify-center">
                                                    <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Volume</span>
                                                    {d.prev.vol === 0 ? (
                                                        <span className="font-bold text-xs text-zinc-400">New</span>
                                                    ) : (
                                                        <span className={cn(
                                                            "font-bold text-xs flex items-center gap-0.5",
                                                            isUp ? "text-brand-primary" : "text-red-400"
                                                        )}>
                                                            {isUp ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
                                                            {isUp ? '+' : ''}{d.pct}%
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* e1RM Delta */}
                                                {(d.prev.maxE1RM > 0 && d.e1rmDiff !== 0) && (
                                                    <div className="flex flex-col items-end justify-center border-l border-zinc-800/80 pl-3">
                                                        <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">e1RM</span>
                                                        <span className={cn(
                                                            "font-bold text-xs flex items-center gap-0.5",
                                                            isE1RMUp ? "text-brand-primary" : "text-red-400"
                                                        )}>
                                                            {isE1RMUp ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
                                                            {isE1RMUp ? '+' : ''}{d.e1rmDiff.toFixed(1)}kg
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
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
                            size={80}
                        />
                        <div className="flex-1">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-2">
                                Muscles Trained
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {muscleGroups.map(mg => (
                                    <span
                                        key={mg}
                                        className="px-2.5 py-0.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[10px] text-brand-primary uppercase font-bold tracking-widest"
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

                {/* Coach Insights */}
                {insights.length > 0 && (
                    <div className="px-6 py-4 border-b border-zinc-800/50 space-y-3">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-2">
                            Coach Insights
                        </span>
                        {insights.map((insight, idx) => {
                            const Icon = insight.icon === 'AlertTriangle' ? AlertTriangle :
                                         insight.icon === 'Trophy' ? Trophy :
                                         insight.icon === 'TrendingUp' ? TrendingUp : Info;
                            return (
                                <motion.div
                                    key={insight.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.8 + idx * 0.1 }}
                                    className={cn(
                                        "p-3 rounded-xl border flex items-start gap-3",
                                        insight.type === 'warning' ? "bg-red-500/10 border-red-500/20" :
                                        insight.type === 'achievement' ? "bg-brand-primary/10 border-brand-primary/20" :
                                        "bg-zinc-800/30 border-zinc-700/50"
                                    )}
                                >
                                    <Icon size={18} className={cn(
                                        "shrink-0 mt-0.5",
                                        insight.type === 'warning' ? "text-red-400" :
                                        insight.type === 'achievement' ? "text-brand-primary" :
                                        "text-zinc-400"
                                    )} />
                                    <div>
                                        <h4 className="text-xs font-bold text-white mb-0.5">{insight.title}</h4>
                                        <p className="text-[11px] text-zinc-400 leading-relaxed">{insight.body}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Actions */}
                <div className="mt-auto px-6 pt-4 pb-8 flex flex-col gap-3 relative z-10 bg-zinc-950">
                    <button
                        onClick={onContinue}
                        className="w-full h-14 bg-brand-primary text-black font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_24px_-4px] shadow-brand-primary/40 active:scale-[0.98] transition-all hover:brightness-110"
                    >
                        <Camera size={18} strokeWidth={2.5} />
                        <span>{t('workoutSummary.takePhoto')}</span>
                    </button>

                    <button
                        onClick={onDismiss}
                        className="w-full h-12 text-zinc-400 font-bold text-sm hover:text-white transition-colors flex items-center justify-center"
                    >
                        {t('workoutSummary.doneClose')}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default WorkoutSummary;
