import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Dumbbell, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { cn } from '../../lib/utils';

interface Props {
    onClose: () => void;
}

type ResultSection = 'exercises' | 'sessions' | 'routines';

/**
 * U-03 — Global Search overlay.
 * Searches across exercises, sessions, and routines simultaneously.
 * Keyboard-accessible (↑↓ arrows, Enter, Esc).
 */
const GlobalSearch: React.FC<Props> = ({ onClose }) => {
    const { exercises, history, routines } = useWorkoutStore();
    const [query, setQuery] = useState('');
    const [selectedIdx, setSelectedIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const q = query.toLowerCase().trim();

    const matchedExercises = q.length < 2 ? [] : exercises
        .filter(e => !e.deletedAt && e.name.toLowerCase().includes(q))
        .slice(0, 4);

    const matchedSessions = q.length < 2 ? [] : history
        .filter(s => s.name.toLowerCase().includes(q))
        .sort((a, b) => b.date - a.date)
        .slice(0, 3);

    const matchedRoutines = q.length < 2 ? [] : routines
        .filter(r => !r.deletedAt && r.name.toLowerCase().includes(q))
        .slice(0, 3);

    type ResultItem = { key: string; section: ResultSection; label: string; sub?: string };

    const allResults: ResultItem[] = [
        ...matchedExercises.map(e => ({
            key: e.id, section: 'exercises' as ResultSection,
            label: e.name, sub: e.targetMuscle
        })),
        ...matchedSessions.map(s => ({
            key: s.id, section: 'sessions' as ResultSection,
            label: s.name, sub: new Date(s.date).toLocaleDateString('pt-BR')
        })),
        ...matchedRoutines.map(r => ({
            key: r.id, section: 'routines' as ResultSection,
            label: r.name,
            sub: `${r.blocks?.length ?? r.exerciseIds.length} exercises`
        })),
    ];

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { onClose(); return; }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIdx(i => Math.min(i + 1, allResults.length - 1));
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIdx(i => Math.max(i - 1, 0));
        }
        if (e.key === 'Enter' && allResults[selectedIdx]) {
            // just close for now — could navigate in future
            onClose();
        }
    };

    const SectionHeader = ({ label }: { label: string }) => (
        <div className="px-4 py-1.5 flex items-center gap-2">
            <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-widest">{label}</span>
            <div className="flex-1 h-px bg-zinc-800" />
        </div>
    );

    const iconFor = (section: ResultSection) => {
        if (section === 'exercises') return <Dumbbell size={13} className="text-zinc-500 shrink-0" />;
        if (section === 'sessions') return <Clock size={13} className="text-zinc-500 shrink-0" />;
        return <BookOpen size={13} className="text-zinc-500 shrink-0" />;
    };

    const content = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-start justify-center pt-[10vh] px-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: -20, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -10, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-[4px] overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                    <Search size={18} className="text-zinc-500 shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
                        onKeyDown={handleKey}
                        placeholder="Search exercises, sessions, routines..."
                        className="flex-1 bg-transparent text-white font-mono placeholder:text-zinc-600 focus:outline-none text-sm"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="text-zinc-600 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    )}
                    <kbd className="hidden sm:flex items-center px-1.5 py-0.5 text-[9px] font-mono text-zinc-600 border border-zinc-800 rounded">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                    {q.length < 2 && (
                        <div className="px-4 py-8 text-center">
                            <p className="text-zinc-600 text-xs font-mono">Type at least 2 characters to search</p>
                        </div>
                    )}

                    {q.length >= 2 && allResults.length === 0 && (
                        <div className="px-4 py-8 text-center">
                            <p className="text-zinc-500 text-sm font-mono">No results for "<span className="text-white">{query}</span>"</p>
                        </div>
                    )}

                    {matchedExercises.length > 0 && (
                        <>
                            <SectionHeader label="Exercises" />
                            {matchedExercises.map((ex, i) => {
                                const idx = i;
                                return (
                                    <button
                                        key={ex.id}
                                        onMouseEnter={() => setSelectedIdx(idx)}
                                        onClick={onClose}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left",
                                            selectedIdx === idx ? "bg-zinc-800" : "hover:bg-zinc-900"
                                        )}
                                    >
                                        {iconFor('exercises')}
                                        <span className="flex-1 text-sm text-white font-mono truncate">{ex.name}</span>
                                        <span className="text-[9px] text-zinc-600 uppercase font-bold">{ex.targetMuscle}</span>
                                        <ChevronRight size={12} className="text-zinc-700" />
                                    </button>
                                );
                            })}
                        </>
                    )}

                    {matchedSessions.length > 0 && (
                        <>
                            <SectionHeader label="Sessions" />
                            {matchedSessions.map((s, i) => {
                                const idx = matchedExercises.length + i;
                                return (
                                    <button
                                        key={s.id}
                                        onMouseEnter={() => setSelectedIdx(idx)}
                                        onClick={onClose}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left",
                                            selectedIdx === idx ? "bg-zinc-800" : "hover:bg-zinc-900"
                                        )}
                                    >
                                        {iconFor('sessions')}
                                        <span className="flex-1 text-sm text-white font-mono truncate">{s.name}</span>
                                        <span className="text-[9px] text-zinc-600">{new Date(s.date).toLocaleDateString('pt-BR')}</span>
                                        <ChevronRight size={12} className="text-zinc-700" />
                                    </button>
                                );
                            })}
                        </>
                    )}

                    {matchedRoutines.length > 0 && (
                        <>
                            <SectionHeader label="Routines" />
                            {matchedRoutines.map((r, i) => {
                                const idx = matchedExercises.length + matchedSessions.length + i;
                                return (
                                    <button
                                        key={r.id}
                                        onMouseEnter={() => setSelectedIdx(idx)}
                                        onClick={onClose}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left",
                                            selectedIdx === idx ? "bg-zinc-800" : "hover:bg-zinc-900"
                                        )}
                                    >
                                        {iconFor('routines')}
                                        <span className="flex-1 text-sm text-white font-mono truncate">{r.name}</span>
                                        <span className="text-[9px] text-zinc-600">{r.blocks?.length ?? r.exerciseIds.length} ex</span>
                                        <ChevronRight size={12} className="text-zinc-700" />
                                    </button>
                                );
                            })}
                        </>
                    )}

                    {allResults.length > 0 && (
                        <div className="flex items-center justify-center gap-4 py-2 border-t border-zinc-900">
                            <span className="text-[9px] font-mono text-zinc-700 flex items-center gap-1">
                                <kbd className="text-zinc-700 border border-zinc-800 px-1 rounded text-[8px]">↑↓</kbd> navigate
                            </span>
                            <span className="text-[9px] font-mono text-zinc-700 flex items-center gap-1">
                                <kbd className="text-zinc-700 border border-zinc-800 px-1 rounded text-[8px]">↵</kbd> select
                            </span>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(content, document.body);
};

export default GlobalSearch;
