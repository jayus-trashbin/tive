import React, { useState, useRef, useEffect } from 'react';
import { Plus, Download, Sparkles, Table2, CalendarDays, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface PlanHeaderProps {
    isSelectionMode: boolean;
    toggleSelectionMode: () => void;
    onShowAIBuilder: () => void;
    onShowImporter: () => void;
    onStartCreate: () => void;
    onShowTableBuilder: () => void;
    onShowMesocycle: () => void;
    hasRoutines: boolean;
}

export const PlanHeader: React.FC<PlanHeaderProps> = ({
    isSelectionMode,
    toggleSelectionMode,
    onShowAIBuilder,
    onShowImporter,
    onStartCreate,
    onShowTableBuilder,
    onShowMesocycle,
    hasRoutines
}) => {
    const [showMore, setShowMore] = useState(false);

    return (
        <header
            className="shrink-0 px-5 pb-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-30"
            style={{ paddingTop: `calc(var(--sat) + 1.25rem)` }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <div className="section-title">Your Training Plans</div>
                    <h1 className="text-3xl font-bold text-white leading-tight">
                        My Routines
                    </h1>
                </div>
            </div>

            {/* ──── TOOLBAR ──── */}
            <div className="flex gap-2 relative">
                {hasRoutines && (
                    <button
                        onClick={toggleSelectionMode}
                        className={cn(
                            "flex-1 h-11 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl text-center flex items-center justify-center border max-w-[80px]",
                            isSelectionMode
                                ? "bg-zinc-800 border-zinc-700 text-white"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700"
                        )}
                    >
                        {isSelectionMode ? "DONE" : "SELECT"}
                    </button>
                )}

                <div className="relative">
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className="h-11 w-11 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded-xl"
                        title="More Actions"
                    >
                        <MoreHorizontal size={18} />
                    </button>

                    {showMore && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                            <motion.div 
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute top-14 left-0 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1"
                            >
                                <button
                                    onClick={() => { onShowAIBuilder(); setShowMore(false); }}
                                    className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-brand-primary hover:bg-zinc-800 transition-colors text-left"
                                >
                                    <Sparkles size={16} />
                                    AI Routine Builder
                                </button>
                                <button
                                    onClick={() => { onShowTableBuilder(); setShowMore(false); }}
                                    className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
                                >
                                    <Table2 size={16} />
                                    Build from Table
                                </button>
                                <button
                                    onClick={() => { onShowMesocycle(); setShowMore(false); }}
                                    className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
                                >
                                    <CalendarDays size={16} />
                                    Mesocycle Planner
                                </button>
                                <div className="h-px bg-zinc-800 my-1" />
                                <button
                                    onClick={() => { onShowImporter(); setShowMore(false); }}
                                    className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
                                >
                                    <Download size={16} />
                                    Import Routine
                                </button>
                            </motion.div>
                        </>
                    )}
                </div>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onStartCreate}
                    className="flex-1 h-11 flex items-center justify-center gap-2 bg-brand-primary text-black font-bold uppercase tracking-wider text-[11px] rounded-xl cursor-pointer shadow-lg hover:brightness-110 transition-all"
                >
                    <Plus size={16} strokeWidth={3} />
                    CREATE
                </motion.button>
            </div>
        </header>
    );
};
