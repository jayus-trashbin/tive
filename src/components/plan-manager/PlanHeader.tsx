import React from 'react';
import { Plus, Download, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface PlanHeaderProps {
    isSelectionMode: boolean;
    toggleSelectionMode: () => void;
    onShowAIBuilder: () => void;
    onShowImporter: () => void;
    onStartCreate: () => void;
    hasRoutines: boolean;
}

export const PlanHeader: React.FC<PlanHeaderProps> = ({
    isSelectionMode,
    toggleSelectionMode,
    onShowAIBuilder,
    onShowImporter,
    onStartCreate,
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
                    <h1 className="page-title">
                        My<span className="text-brand-primary">_</span>Routines
                    </h1>
                </div>
            </div>

            {/* ──── TOOLBAR ──── */}
            <div className="flex gap-2">
                {hasRoutines && (
                    <button
                        onClick={toggleSelectionMode}
                        className={cn(
                            "flex-1 h-11 text-[10px] font-heading font-bold uppercase tracking-wider border transition-all rounded-[2px] text-center flex items-center justify-center",
                            isSelectionMode
                                ? "bg-zinc-800 border-zinc-700 text-white"
                                : "bg-transparent border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600"
                        )}
                    >
                        {isSelectionMode ? "DONE" : "SELECT"}
                    </button>
                )}

                <button
                    onClick={onShowAIBuilder}
                    className="h-11 w-11 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-brand-primary rounded-[2px] hover:bg-zinc-800 transition-colors"
                >
                    <Sparkles size={18} />
                </button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onShowImporter}
                    className="h-11 w-11 flex items-center justify-center border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all rounded-[2px] cursor-pointer"
                >
                    <Download size={18} />
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onStartCreate}
                    className="flex-1 h-11 flex items-center justify-center gap-2 btn-tech text-[10px] rounded-[2px] cursor-pointer"
                >
                    <Plus size={16} strokeWidth={3} />
                    CREATE
                </motion.button>
            </div>
        </header>
    );
};
