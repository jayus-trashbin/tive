import React from 'react';
import { Plus, Download, Sparkles, Table2, CalendarDays } from 'lucide-react';
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
            <div className="flex gap-2">
                {hasRoutines && (
                    <button
                        onClick={toggleSelectionMode}
                        className={cn(
                            "flex-1 h-11 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl text-center flex items-center justify-center border",
                            isSelectionMode
                                ? "bg-zinc-800 border-zinc-700 text-white"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700"
                        )}
                    >
                        {isSelectionMode ? "DONE" : "SELECT"}
                    </button>
                )}

                <button
                    onClick={onShowAIBuilder}
                    className="h-11 w-11 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-brand-primary rounded-xl hover:bg-zinc-800 transition-colors"
                    title="AI Routine Builder"
                >
                    <Sparkles size={18} />
                </button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onShowTableBuilder}
                    className="h-11 w-11 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-brand-primary hover:border-brand-primary/40 transition-all rounded-xl cursor-pointer"
                    title="Build from table"
                >
                    <Table2 size={18} />
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onShowMesocycle}
                    className="h-11 w-11 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all rounded-xl cursor-pointer"
                    title="Mesocycle Planner"
                >
                    <CalendarDays size={18} />
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onShowImporter}
                    className="h-11 w-11 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all rounded-xl cursor-pointer"
                >
                    <Download size={18} />
                </motion.button>

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
