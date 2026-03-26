
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, Minus, ChevronDown, Zap, Plus, Shuffle, Waves, RefreshCw, X } from 'lucide-react';
import { PlateauSuggestion, ExerciseProgressStatus, ProgressionStatus } from '../../utils/engine';
import { cn } from '../../lib/utils';

interface Props {
    status: ExerciseProgressStatus;
    suggestions: PlateauSuggestion[];
}

const STATUS_CONFIG: Record<ProgressionStatus, {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    Icon: React.ElementType;
}> = {
    new: {
        label: 'New',
        color: 'text-zinc-400',
        bgColor: 'bg-zinc-900/50',
        borderColor: 'border-zinc-800',
        Icon: Minus
    },
    progressing: {
        label: 'Progressing',
        color: 'text-brand-success',
        bgColor: 'bg-brand-success/5',
        borderColor: 'border-brand-success/20',
        Icon: TrendingDown // will be overridden below
    },
    plateau: {
        label: 'Plateau',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/5',
        borderColor: 'border-amber-500/20',
        Icon: Minus
    },
    stalled: {
        label: 'Stalled',
        color: 'text-red-400',
        bgColor: 'bg-red-500/5',
        borderColor: 'border-red-500/20',
        Icon: TrendingDown
    }
};

const SUGGESTION_ICONS: Record<string, React.ElementType> = {
    Zap, Plus, Shuffle, Waves, RefreshCw
};

/**
 * E-02 — Plateau/Stall alert shown inside ExerciseGroup when
 * the progression engine detects a plateau or stall.
 */
const PlateauAlert: React.FC<Props> = ({ status, suggestions }) => {
    const [expanded, setExpanded] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || (status.status !== 'plateau' && status.status !== 'stalled')) {
        return null;
    }

    const config = STATUS_CONFIG[status.status];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                    'mx-3 mb-2 rounded-[4px] border overflow-hidden',
                    config.bgColor, config.borderColor
                )}
            >
                {/* Header row */}
                <div className="flex items-center gap-2 px-3 py-2">
                    <div className={cn('flex items-center gap-1.5 flex-1 min-w-0', config.color)}>
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            ⚠ {config.label}
                        </span>
                        <span className="text-[10px] text-zinc-500 truncate hidden sm:inline">
                            {status.message}
                        </span>
                    </div>
                    {suggestions.length > 0 && (
                        <button
                            onClick={() => setExpanded(prev => !prev)}
                            className={cn(
                                'text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 transition-colors',
                                config.color
                            )}
                        >
                            Tips
                            <ChevronDown
                                size={10}
                                className={cn('transition-transform', expanded && 'rotate-180')}
                            />
                        </button>
                    )}
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
                    >
                        <X size={12} />
                    </button>
                </div>

                {/* Expanded suggestions */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-3 pb-3 flex flex-col gap-2">
                                {suggestions.map((s, i) => {
                                    const Icon = SUGGESTION_ICONS[s.icon] || Zap;
                                    return (
                                        <div
                                            key={i}
                                            className="flex items-start gap-2 bg-white/5 rounded-[4px] p-2"
                                        >
                                            <div className={cn('mt-0.5 shrink-0', config.color)}>
                                                <Icon size={12} />
                                            </div>
                                            <div>
                                                <p className={cn('text-[10px] font-bold leading-tight', config.color)}>
                                                    {s.title}
                                                </p>
                                                <p className="text-[9px] text-zinc-500 leading-tight mt-0.5">
                                                    {s.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
};

export default PlateauAlert;
