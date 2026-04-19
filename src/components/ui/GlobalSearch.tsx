import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Search, X, Dumbbell, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { cn } from '../../lib/utils';

interface Props {
    onClose: () => void;
}

type ResultSection = 'exercises' | 'sessions' | 'routines';

/**
 * U-03 — Global Search — Mobile-first bottom-sheet on mobile, centered modal on desktop.
 * Touch targets: minimum 48px rows.
 * Keyboard: ↑↓, Enter, Esc. Swipe-down to dismiss.
 */
const GlobalSearch: React.FC<Props> = ({ onClose }) => {
    const { exercises, history, routines } = useWorkoutStore();
    const [query, setQuery] = useState('');
    const [selectedIdx, setSelectedIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragControls = useDragControls();

    // Focus input on mount (desktop) — on mobile the keyboard opens automatically
    useEffect(() => {
        // Slight delay so animation settles first
        const t = setTimeout(() => inputRef.current?.focus(), 150);
        return () => clearTimeout(t);
    }, []);

    // Close on back-swipe / Escape
    const handleKey = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { onClose(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, allResults.length - 1)); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter' && allResults[selectedIdx]) onClose();
    }, [selectedIdx, onClose]);

    const q = query.toLowerCase().trim();

    const matchedExercises = q.length < 2 ? [] : exercises
        .filter(e => !e.deletedAt && e.name.toLowerCase().includes(q)).slice(0, 5);

    const matchedSessions = q.length < 2 ? [] : history
        .filter(s => s.name.toLowerCase().includes(q))
        .sort((a, b) => b.date - a.date).slice(0, 3);

    const matchedRoutines = q.length < 2 ? [] : routines
        .filter(r => !r.deletedAt && r.name.toLowerCase().includes(q)).slice(0, 3);

    type ResultItem = { key: string; section: ResultSection; label: string; sub?: string };
    const allResults: ResultItem[] = [
        ...matchedExercises.map(e => ({ key: e.id, section: 'exercises' as ResultSection, label: e.name, sub: e.targetMuscle })),
        ...matchedSessions.map(s => ({ key: s.id, section: 'sessions' as ResultSection, label: s.name, sub: new Date(s.date).toLocaleDateString('pt-BR') })),
        ...matchedRoutines.map(r => ({ key: r.id, section: 'routines' as ResultSection, label: r.name, sub: `${r.blocks?.length ?? r.exerciseIds.length} ex` })),
    ];

    const SectionHeader = ({ label }: { label: string }) => (
        <div className="px-4 py-2 flex items-center gap-2">
            <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-widest">{label}</span>
            <div className="flex-1 h-px bg-zinc-800" />
        </div>
    );

    const iconFor = (section: ResultSection) => {
        if (section === 'exercises') return <Dumbbell size={14} className="text-zinc-500 shrink-0" />;
        if (section === 'sessions')  return <Clock    size={14} className="text-zinc-500 shrink-0" />;
        return <BookOpen size={14} className="text-zinc-500 shrink-0" />;
    };

    const ResultRow = ({ item, idx, globalIdx }: { item: ResultItem; idx: number; globalIdx: number }) => (
        <button
            key={item.key}
            onMouseEnter={() => setSelectedIdx(globalIdx)}
            onClick={onClose}
            // min-h-[48px] satisfies Apple/Google 44-48px touch target guideline
            className={cn(
                "w-full flex items-center gap-3 px-4 min-h-[48px] py-2 transition-colors text-left active:bg-zinc-800 cursor-pointer",
                selectedIdx === globalIdx ? "bg-zinc-800" : "hover:bg-zinc-900/80"
            )}
        >
            {iconFor(item.section)}
            <span className="flex-1 text-sm text-white font-mono truncate">{item.label}</span>
            {item.sub && <span className="text-[9px] text-zinc-600 uppercase font-bold shrink-0">{item.sub}</span>}
            <ChevronRight size={13} className="text-zinc-700 shrink-0 ml-1" />
        </button>
    );

    const content = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            // Full overlay — clicking backdrop closes
            className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex flex-col"
            onClick={onClose}
        >
            {/* ── DESKTOP: centered card (md+) ────────────────────────────────── */}
            <div className="hidden md:flex flex-col flex-1 items-start justify-start pt-[12vh] px-4">
                <motion.div
                    initial={{ y: -16, opacity: 0, scale: 0.97 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -8, opacity: 0, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    className="w-full max-w-lg mx-auto bg-zinc-950 border border-zinc-800 rounded-[4px] overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <SearchContent
                        query={query} setQuery={setQuery} setSelectedIdx={setSelectedIdx}
                        handleKey={handleKey} inputRef={inputRef}
                        allResults={allResults} matchedExercises={matchedExercises}
                        matchedSessions={matchedSessions} matchedRoutines={matchedRoutines}
                        SectionHeader={SectionHeader} ResultRow={ResultRow}
                        q={q} onClose={onClose}
                        showKbd
                    />
                </motion.div>
            </div>

            {/* ── MOBILE: bottom-sheet ─────────────────────────────────────────── */}
            <motion.div
                className="md:hidden flex flex-col flex-1 justify-end"
                onClick={e => e.stopPropagation()}
            >
                {/* Tap-to-dismiss area above sheet */}
                <div className="flex-1" onClick={onClose} />

                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    drag="y"
                    dragControls={dragControls}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={{ top: 0, bottom: 0.4 }}
                    onDragEnd={(_, info) => {
                        if (info.offset.y > 80) onClose();
                    }}
                    className="bg-zinc-950 border-t border-zinc-800 rounded-t-[18px] overflow-hidden"
                    style={{ maxHeight: '90dvh' }}
                >
                    {/* Drag handle — also touch target to swipe */}
                    <div
                        className="flex justify-center items-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
                        onPointerDown={e => dragControls.start(e)}
                    >
                        <div className="w-10 h-1 bg-zinc-700 rounded-full" />
                    </div>

                    <SearchContent
                        query={query} setQuery={setQuery} setSelectedIdx={setSelectedIdx}
                        handleKey={handleKey} inputRef={inputRef}
                        allResults={allResults} matchedExercises={matchedExercises}
                        matchedSessions={matchedSessions} matchedRoutines={matchedRoutines}
                        SectionHeader={SectionHeader} ResultRow={ResultRow}
                        q={q} onClose={onClose}
                        showKbd={false}
                    />
                </motion.div>
            </motion.div>
        </motion.div>
    );

    return createPortal(content, document.body);
};

// ─────────────────────────────────────────────────────
// Shared search content (reused in desktop + mobile)
// ─────────────────────────────────────────────────────
interface SearchContentProps {
    query: string;
    setQuery: (q: string) => void;
    setSelectedIdx: (fn: (i: number) => number) => void;
    handleKey: (e: React.KeyboardEvent) => void;
    inputRef: React.RefObject<HTMLInputElement>;
    allResults: { key: string; section: string; label: string; sub?: string }[];
    matchedExercises: any[];
    matchedSessions: any[];
    matchedRoutines: any[];
    SectionHeader: React.FC<{ label: string }>;
    ResultRow: React.FC<{ item: any; idx: number; globalIdx: number }>;
    q: string;
    onClose: () => void;
    showKbd: boolean;
}

const SearchContent: React.FC<SearchContentProps> = ({
    query, setQuery, setSelectedIdx, handleKey, inputRef,
    allResults, matchedExercises, matchedSessions, matchedRoutines,
    SectionHeader, ResultRow, q, onClose, showKbd
}) => (
    <>
        {/* Search Input row — min 48px */}
        <div className="flex items-center gap-3 px-4 border-b border-zinc-800 min-h-[52px]">
            <Search size={18} className="text-zinc-500 shrink-0" />
            <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIdx(() => 0); }}
                onKeyDown={handleKey}
                placeholder="Search exercises, sessions, routines..."
                inputMode="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="flex-1 bg-transparent text-white font-mono placeholder:text-zinc-600 focus:outline-none text-base py-3"
            />
            {query ? (
                // 44px touch target for clear button
                <button
                    onClick={() => setQuery('')}
                    className="flex items-center justify-center w-10 h-10 rounded-full text-zinc-500 hover:text-white active:bg-zinc-800 transition-colors -mr-2"
                    aria-label="Clear search"
                >
                    <X size={16} />
                </button>
            ) : showKbd ? (
                <kbd className="flex items-center px-1.5 py-0.5 text-[9px] font-mono text-zinc-600 border border-zinc-800 rounded">ESC</kbd>
            ) : null}
        </div>

        {/* Results list */}
        <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: '65dvh' }}>
            {q.length < 2 && (
                <div className="px-4 py-10 text-center">
                    <Search size={28} className="text-zinc-800 mx-auto mb-3" />
                    <p className="text-zinc-600 text-xs font-mono">Type to search exercises, sessions or routines</p>
                </div>
            )}

            {q.length >= 2 && allResults.length === 0 && (
                <div className="px-4 py-10 text-center">
                    <p className="text-zinc-500 text-sm font-mono">No results for "<span className="text-white">{query}</span>"</p>
                </div>
            )}

            {matchedExercises.length > 0 && (
                <>
                    <SectionHeader label="Exercises" />
                    {matchedExercises.map((ex, i) => (
                        <ResultRow key={ex.id} item={{ key: ex.id, section: 'exercises', label: ex.name, sub: ex.targetMuscle }} idx={i} globalIdx={i} />
                    ))}
                </>
            )}

            {matchedSessions.length > 0 && (
                <>
                    <SectionHeader label="Sessions" />
                    {matchedSessions.map((s, i) => (
                        <ResultRow key={s.id} item={{ key: s.id, section: 'sessions', label: s.name, sub: new Date(s.date).toLocaleDateString('pt-BR') }} idx={i} globalIdx={matchedExercises.length + i} />
                    ))}
                </>
            )}

            {matchedRoutines.length > 0 && (
                <>
                    <SectionHeader label="Routines" />
                    {matchedRoutines.map((r, i) => (
                        <ResultRow key={r.id} item={{ key: r.id, section: 'routines', label: r.name, sub: `${r.blocks?.length ?? r.exerciseIds.length} ex` }} idx={i} globalIdx={matchedExercises.length + matchedSessions.length + i} />
                    ))}
                </>
            )}

            {/* Safe area spacer for home bar */}
            <div className="pb-safe" />
        </div>

        {/* Keyboard hints (desktop only) */}
        {showKbd && allResults.length > 0 && (
            <div className="flex items-center justify-center gap-4 py-2 border-t border-zinc-900">
                <span className="text-[9px] font-mono text-zinc-700 flex items-center gap-1">
                    <kbd className="text-zinc-700 border border-zinc-800 px-1 rounded text-[8px]">↑↓</kbd> navigate
                </span>
                <span className="text-[9px] font-mono text-zinc-700 flex items-center gap-1">
                    <kbd className="text-zinc-700 border border-zinc-800 px-1 rounded text-[8px]">↵</kbd> select
                </span>
            </div>
        )}
    </>
);

export default GlobalSearch;
