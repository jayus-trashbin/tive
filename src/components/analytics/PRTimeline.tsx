import React, { useMemo, useState } from 'react';
import { Trophy, Calendar, ChevronDown, X } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getRecentPRs } from '../../utils/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * A-08 — PR Timeline with exercise filter.
 * Renders all PRs (up to 50) and lets the user filter by specific exercise.
 */
const PRTimeline: React.FC = () => {
    const history = useWorkoutStore(state => state.history);
    const exercises = useWorkoutStore(state => state.exercises);
    const [filterExId, setFilterExId] = useState<string | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const allPRs = useMemo(() => getRecentPRs(history, exercises, 50), [history, exercises]);

    // Unique exercise names that have PRs for dropdown
    const prExercises = useMemo(() => {
        const seen = new Map<string, string>();
        allPRs.forEach(pr => {
            const ex = exercises.find(e => e.name === pr.exerciseName);
            if (ex && !seen.has(ex.id)) seen.set(ex.id, pr.exerciseName);
        });
        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [allPRs, exercises]);

    const filtered = useMemo(() =>
        filterExId ? allPRs.filter(pr => {
            const ex = exercises.find(e => e.id === filterExId);
            return ex && pr.exerciseName === ex.name;
        }) : allPRs,
        [allPRs, filterExId, exercises]
    );

    const activeEx = filterExId ? prExercises.find(e => e.id === filterExId) : null;

    if (allPRs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/30 border border-zinc-800 rounded-[4px]">
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
                    <Trophy size={20} className="text-zinc-600" />
                </div>
                <p className="text-xs font-mono text-zinc-500 uppercase">No PRs recorded yet</p>
                <p className="text-[10px] text-zinc-600 mt-1 max-w-[200px]">Push your limits to see your achievements here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Row */}
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">Filter:</span>
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(v => !v)}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-[3px] border transition-colors",
                            activeEx
                                ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                        )}
                    >
                        <Trophy size={9} />
                        {activeEx ? activeEx.name : 'All Exercises'}
                        <ChevronDown size={9} className={cn("transition-transform", dropdownOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                        {dropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-[4px] shadow-2xl z-20 overflow-hidden max-h-48 overflow-y-auto"
                                >
                                    <button
                                        onClick={() => { setFilterExId(null); setDropdownOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border-b border-zinc-800"
                                    >
                                        All Exercises
                                    </button>
                                    {prExercises.map(ex => (
                                        <button
                                            key={ex.id}
                                            onClick={() => { setFilterExId(ex.id); setDropdownOpen(false); }}
                                            className={cn(
                                                "w-full text-left px-3 py-2 text-[10px] font-bold transition-colors border-b border-zinc-800 last:border-0",
                                                filterExId === ex.id
                                                    ? "text-brand-primary bg-brand-primary/5"
                                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                            )}
                                        >
                                            {ex.name}
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {activeEx && (
                    <button onClick={() => setFilterExId(null)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                        <X size={12} />
                    </button>
                )}

                <span className="ml-auto text-[9px] text-zinc-700 font-mono">{filtered.length} PR{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Timeline */}
            <div className="relative pl-4 space-y-4 before:absolute before:inset-y-0 before:left-[5px] before:w-[1px] before:bg-zinc-800">
                <AnimatePresence mode="popLayout">
                    {filtered.map((pr, index) => {
                        const date = new Date(pr.date);
                        const isRecent = (Date.now() - pr.date) < 7 * 24 * 60 * 60 * 1000;
                        return (
                            <motion.div
                                key={`${pr.date}-${pr.exerciseName}`}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10, height: 0 }}
                                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                                className="relative"
                            >
                                {/* Dot */}
                                <div className={cn(
                                    'absolute -left-[19px] top-1 w-[9px] h-[9px] rounded-sm border',
                                    isRecent
                                        ? 'bg-brand-primary border-brand-primary shadow-[0_0_10px_rgba(190,242,100,0.4)]'
                                        : 'bg-zinc-900 border-zinc-700'
                                )} />

                                <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-[4px] hover:border-zinc-700 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-xs font-bold text-white font-mono uppercase truncate mr-2">{pr.exerciseName}</h3>
                                        <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1 shrink-0">
                                            <Calendar size={9} />
                                            {date.toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-black text-brand-primary font-mono tracking-tighter">
                                            {pr.estimated1RM} <span className="text-[10px] text-zinc-600">KG (1RM)</span>
                                        </span>
                                        <span className="text-[10px] font-mono text-zinc-500">
                                            {pr.weight}kg × {pr.reps}
                                        </span>
                                    </div>

                                    {isRecent && (
                                        <div className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-brand-primary/10 border border-brand-primary/20 rounded-[2px]">
                                            <Trophy size={10} className="text-brand-primary" />
                                            <span className="text-[8px] font-bold text-brand-primary uppercase tracking-wider">New Record</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PRTimeline;
