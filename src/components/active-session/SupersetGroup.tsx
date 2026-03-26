
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link2, Zap } from 'lucide-react';
import { Exercise, WorkoutSet, Session } from '../../types';
import { cn } from '../../lib/utils';
import ExerciseGroup from './ExerciseGroup';

interface SupersetItem {
    exercise: Exercise;
    sets: WorkoutSet[];
}

interface Props {
    /** All exercises that belong to this superset block (in order) */
    items: SupersetItem[];
    history: Session[];
    allExerciseIds: string[];
    registerRef?: (id: string, node: HTMLDivElement | null) => void;
    onAutoScrollRequest?: (nextExerciseId: string) => void;
    onReplaceRequest?: (exerciseId: string) => void;
    /** Optional props forwarded to each ExerciseGroup for drag-and-drop */
    dragHandleProps?: any;
    /** Round index label (e.g. "A", "B", "C") — shown on each card */
    supersetLabel?: string;
}

const SupersetGroup: React.FC<Props> = ({
    items,
    history,
    allExerciseIds,
    registerRef,
    onAutoScrollRequest,
    onReplaceRequest,
    supersetLabel = 'SS',
}) => {
    // The superset is fully done when every exercise has all sets completed
    const allDone = useMemo(
        () => items.every(item => item.sets.length > 0 && item.sets.every(s => s.isCompleted)),
        [items]
    );

    // How many rounds have at least one set (use as round counter)
    const exerciseNames = items.map(i => i.exercise.name).join(' × ');

    return (
        <div className={cn(
            'relative rounded-[4px] transition-all duration-500',
            'border-2',
            allDone ? 'border-brand-success/30 opacity-60 grayscale-[0.3]' : 'border-amber-500/40'
        )}>

            {/* ── SUPERSET HEADER BADGE ── */}
            <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border-b border-amber-500/20">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-sm bg-amber-500 text-black">
                        <Link2 size={11} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 font-heading">
                        Superset
                    </span>
                    <span className="hidden text-[9px] text-amber-500/60 font-mono sm:inline truncate max-w-[160px]">
                        {exerciseNames}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    {allDone ? (
                        <span className="text-[9px] font-bold text-brand-success uppercase tracking-wider">
                            ✓ Done
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[9px] text-amber-400 font-mono font-bold">
                            <Zap size={9} />
                            {items.length} exercises
                        </span>
                    )}
                </div>
            </div>

            {/* ── EXERCISE CARDS ── */}
            <div className="flex flex-col divide-y divide-amber-500/10 bg-zinc-950/20">
                {items.map((item, index) => (
                    <div key={item.exercise.id} className="relative">
                        {/* Chain connector line — drawn between cards */}
                        {index < items.length - 1 && (
                            <div className="absolute bottom-0 left-7 w-px bg-amber-500/40 z-10"
                                style={{ height: '100%', bottom: '-100%' }}
                            />
                        )}

                        {/* Round label pill in top-left */}
                        <div className="absolute top-4 left-3 z-20 w-5 h-5 rounded-sm bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-black flex items-center justify-center font-mono">
                            {String.fromCharCode(65 + index)}{/* A, B, C… */}
                        </div>

                        <div className="pl-1">
                            <ExerciseGroup
                                exercise={item.exercise}
                                sets={item.sets}
                                history={history}
                                allExerciseIds={allExerciseIds}
                                registerRef={registerRef}
                                onAutoScrollRequest={onAutoScrollRequest}
                                onReplaceRequest={() => onReplaceRequest?.(item.exercise.id)}
                                isSuperset={true}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── TRANSITION REST HINT ── */}
            {allDone && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-2 bg-brand-success/5 border-t border-brand-success/20 flex items-center gap-2"
                >
                    <span className="text-[10px] text-brand-success font-bold uppercase tracking-wider">
                        Superset complete — rest before next round
                    </span>
                </motion.div>
            )}
        </div>
    );
};

export default React.memo(SupersetGroup);
