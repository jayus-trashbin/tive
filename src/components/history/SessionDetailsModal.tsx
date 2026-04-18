
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Session, Exercise } from '../../types';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { X, Calendar, Clock, Dumbbell, Trophy, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
    session: Session | null;
    onClose: () => void;
}

const SessionDetailsModal: React.FC<Props> = ({ session, onClose }) => {
    const { exercises, history, deleteSession } = useWorkoutStore();

    const sessionExercises = useMemo(() => {
        if (!session) return [];
        const orderedIds = Array.from(new Set(session.sets.map(s => s.exerciseId)));
        return orderedIds.map(id => {
            const ex = exercises.find(e => e.id === id);
            const sets = session.sets.filter(s => s.exerciseId === id);
            return { exercise: ex, sets };
        });
    }, [session, exercises]);

    const duration = useMemo(() => {
        if (!session || !session.updatedAt) return null;
        const diff = Math.floor((session.updatedAt - session.date) / 1000 / 60);
        return diff > 0 ? `${diff} min` : '< 1 min';
    }, [session]);

    // A-03: Find the most recent previous session with the same routine
    const previousSession = useMemo(() => {
        if (!session) return null;
        const sorted = [...history]
            .filter(s =>
                s.isCompleted &&
                !s.deletedAt &&
                s.id !== session.id &&
                s.date < session.date &&
                (session.routineId ? s.routineId === session.routineId : s.name === session.name)
            )
            .sort((a, b) => b.date - a.date);
        return sorted[0] || null;
    }, [session, history]);

    // A-03: Per-exercise comparison
    const comparisonByExercise = useMemo(() => {
        if (!session || !previousSession) return null;
        const map = new Map<string, { currVol: number; prevVol: number; currBest1RM: number; prevBest1RM: number }>();

        session.sets.filter(s => s.isCompleted).forEach(s => {
            const c = map.get(s.exerciseId) || { currVol: 0, prevVol: 0, currBest1RM: 0, prevBest1RM: 0 };
            c.currVol += s.weight * s.reps;
            if ((s.estimated1RM || 0) > c.currBest1RM) c.currBest1RM = s.estimated1RM || 0;
            map.set(s.exerciseId, c);
        });

        previousSession.sets.filter(s => s.isCompleted).forEach(s => {
            const c = map.get(s.exerciseId);
            if (c) {
                c.prevVol += s.weight * s.reps;
                if ((s.estimated1RM || 0) > c.prevBest1RM) c.prevBest1RM = s.estimated1RM || 0;
            }
        });

        return map;
    }, [session, previousSession]);

    // Total comparison
    const totalComparison = useMemo(() => {
        if (!session || !previousSession) return null;
        const currVol = session.sets.filter(s => s.isCompleted).reduce((a, s) => a + s.weight * s.reps, 0);
        const prevVol = previousSession.sets.filter(s => s.isCompleted).reduce((a, s) => a + s.weight * s.reps, 0);
        if (prevVol === 0) return null;
        const diff = currVol - prevVol;
        const pct = Math.round((diff / prevVol) * 100);
        return { diff, pct, currVol, prevVol };
    }, [session, previousSession]);

    if (!session) return null;

    const dateObj = new Date(session.date);

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this workout permanently?")) {
            deleteSession(session.id);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center"
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg h-[90vh] bg-zinc-950 border-t sm:border border-white/10 rounded-t-[4px] sm:rounded-[4px] flex flex-col shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div
                        className="flex justify-between items-start p-6 pb-4 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md z-10 sticky top-0"
                        style={{ paddingTop: `calc(var(--sat) + 1.5rem)` }}
                    >
                        <div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Calendar size={12} /> {dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            <h2 className="text-2xl font-black text-white leading-tight max-w-[250px]">
                                {session.name}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        {/* Key Stats Row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
                                <Dumbbell size={16} className="text-brand-primary" />
                                <span className="text-lg font-black text-white">
                                    {session.volumeLoad > 1000 ? (session.volumeLoad / 1000).toFixed(1) + 'k' : session.volumeLoad}
                                </span>
                                <span className="text-[9px] text-zinc-500 uppercase font-bold">Volume (kg)</span>
                                {/* A-03: delta badge */}
                                {totalComparison && (
                                    <span className={cn(
                                        "text-[8px] font-bold flex items-center gap-0.5",
                                        totalComparison.pct >= 0 ? "text-brand-primary" : "text-red-400"
                                    )}>
                                        {totalComparison.pct >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                                        {totalComparison.pct >= 0 ? '+' : ''}{totalComparison.pct}% vs prev
                                    </span>
                                )}
                            </div>
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
                                <Clock size={16} className="text-blue-400" />
                                <span className="text-lg font-black text-white">{duration || '--'}</span>
                                <span className="text-[9px] text-zinc-500 uppercase font-bold">Duration</span>
                            </div>
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
                                <Trophy size={16} className="text-brand-warning" />
                                <span className="text-lg font-black text-white">{session.sets.filter(s => s.isPR).length}</span>
                                <span className="text-[9px] text-zinc-500 uppercase font-bold">Records</span>
                            </div>
                        </div>

                        {/* A-03: Previous session comparison banner */}
                        {previousSession && (
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[4px] p-3">
                                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <TrendingUp size={9} className="text-brand-primary" />
                                    vs. {new Date(previousSession.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {Array.from(comparisonByExercise?.entries() || []).slice(0, 4).map(([exId, comp]) => {
                                        const ex = exercises.find(e => e.id === exId);
                                        const volDiff = comp.currVol - comp.prevVol;
                                        const rmDiff = comp.currBest1RM - comp.prevBest1RM;
                                        return (
                                            <div key={exId} className="bg-zinc-900 rounded-[3px] p-2">
                                                <div className="text-[9px] text-zinc-400 font-bold truncate mb-1">{ex?.name || 'Exercise'}</div>
                                                <div className={cn("text-[10px] font-black flex items-center gap-0.5", volDiff >= 0 ? "text-brand-primary" : "text-red-400")}>
                                                    {volDiff >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                                                    {volDiff >= 0 ? '+' : ''}{volDiff.toFixed(0)} kg vol
                                                </div>
                                                {comp.prevBest1RM > 0 && (
                                                    <div className={cn("text-[9px] font-bold flex items-center gap-0.5", rmDiff > 0 ? "text-brand-primary" : rmDiff < 0 ? "text-red-400" : "text-zinc-500")}>
                                                        {rmDiff > 0 ? <TrendingUp size={7} /> : rmDiff < 0 ? <TrendingDown size={7} /> : <Minus size={7} />}
                                                        {rmDiff > 0 ? '+' : ''}{rmDiff.toFixed(1)} 1RM
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Exercises Detail */}
                        <div className="space-y-6">
                            {sessionExercises.map(({ exercise, sets }, i) => (
                                <div key={i} className="animate-in slide-in-from-bottom-2 fade-in fill-mode-backwards" style={{ animationDelay: `${i * 50}ms` }}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden shrink-0">
                                            {exercise?.staticImageUrl || exercise?.gifUrl ? (
                                                <img src={exercise?.staticImageUrl || exercise?.gifUrl} className="w-full h-full object-cover opacity-80" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Dumbbell size={16} className="text-zinc-700" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm">{exercise?.name || 'Unknown Exercise'}</h3>
                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{exercise?.targetMuscle}</div>
                                        </div>
                                    </div>

                                    <div className="border border-white/5 rounded-2xl overflow-hidden bg-zinc-900/50">
                                        <div className="grid grid-cols-[30px_1fr_1fr_1fr] bg-zinc-900 border-b border-white/5 py-1.5 px-3">
                                            <div className="text-[9px] font-bold text-zinc-600 text-center">#</div>
                                            <div className="text-[9px] font-bold text-zinc-600 text-center">KG</div>
                                            <div className="text-[9px] font-bold text-zinc-600 text-center">REPS</div>
                                            <div className="text-[9px] font-bold text-zinc-600 text-center">1RM</div>
                                        </div>
                                        {sets.map((set, idx) => (
                                            <div key={set.id} className={cn(
                                                "grid grid-cols-[30px_1fr_1fr_1fr] py-2 px-3 items-center border-b border-white/5 last:border-0",
                                                set.isPR && "bg-brand-warning/5"
                                            )}>
                                                <div className="flex justify-center">
                                                    <span className={cn(
                                                        "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono",
                                                        set.type === 'warmup' ? "bg-yellow-500/20 text-yellow-500" :
                                                            set.type === 'failure' ? "bg-red-500/20 text-red-500" :
                                                                "bg-zinc-800 text-zinc-400"
                                                    )}>{idx + 1}</span>
                                                </div>
                                                <div className="text-center font-mono font-bold text-sm text-white">{set.weight}</div>
                                                <div className="text-center font-mono font-bold text-sm text-white">{set.reps}</div>
                                                <div className="text-center font-mono text-xs text-zinc-500">
                                                    {set.isPR ? (
                                                        <span className="text-brand-warning font-bold flex items-center justify-center gap-1">
                                                            {set.estimated1RM} <Trophy size={8} />
                                                        </span>
                                                    ) : (
                                                        set.estimated1RM
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 flex justify-center" style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 2rem)` }}>
                            <button
                                onClick={handleDelete}
                                className="text-red-500/60 hover:text-red-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
                            >
                                <Trash2 size={14} /> Delete Entry
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SessionDetailsModal;
