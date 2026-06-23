
import React, { useState, useMemo, useCallback } from 'react';
import { WorkoutSet, SetType } from '../../types';
import { Check, Trash2, Copy, Plus, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, PanInfo } from 'framer-motion';
import { calculateHybrid1RM } from '../../utils/formulas';
import RpePicker from './RpePicker';
import { useUIStore } from '../../store/useUIStore';
import { useHaptic } from '../../hooks/useHaptic';
import { useWorkoutStore } from '../../store/useWorkoutStore';

interface Props {
    index: number;
    set: WorkoutSet;
    previousSet?: WorkoutSet | null;
    onUpdate: (field: keyof WorkoutSet, value: WorkoutSet[keyof WorkoutSet]) => void;
    onComplete: () => void;
    onDelete: () => void;
    onClone?: () => void;
    getInputId: (field: 'weight' | 'reps') => string;
}

const SetRow: React.FC<Props> = ({
    index, set, previousSet, onUpdate, onComplete, onDelete, onClone, getInputId
}) => {
    const isCompleted = set.isCompleted;
    const [showRpePicker, setShowRpePicker] = useState(false);
    const { trigger: haptic } = useHaptic();
    const gymMode = useWorkoutStore(s => s.userStats.gymMode ?? false);

    // C-01: Live e1RM — calculated from current weight × reps × RPE
    const e1rm = useMemo(() => {
        if (set.weight > 0 && set.reps > 0 && set.type !== 'warmup') {
            return calculateHybrid1RM(set.weight, set.reps, set.rpe || 10);
        }
        return null;
    }, [set.weight, set.reps, set.rpe, set.type]);

    // C-02: Delta badge — weight diff vs previous set
    const delta = useMemo(() => {
        if (!isCompleted || !previousSet || previousSet.weight === 0) return null;
        return Math.round((set.weight - previousSet.weight) * 10) / 10;
    }, [isCompleted, set.weight, previousSet]);

    // C-03: Gym Mode steppers
    const handleStep = useCallback((field: 'weight' | 'reps', direction: 1 | -1) => {
        const inc = field === 'weight' ? 2.5 : 1;
        const next = Math.max(0, Math.round(((set[field] as number) + direction * inc) * 10) / 10);
        onUpdate(field, next);
        if (field === 'weight' && next > 0) {
            useUIStore.getState().setPlateTargetWeight(next);
        }
        haptic('light');
    }, [set, onUpdate, haptic]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'weight' | 'reps') => {
        const val = e.target.value;
        const num = val === '' ? 0 : parseFloat(val);
        onUpdate(field, num);
        if (field === 'weight' && num > 0) {
            useUIStore.getState().setPlateTargetWeight(num);
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>, field: 'weight' | 'reps') => {
        e.target.select();
        // Auto-fill from previous set if currently empty (0)
        if (set[field] === 0 && previousSet && previousSet[field] > 0) {
            // Magic: if both are 0, auto-fill both at once for maximum frictionless UX
            if (set.weight === 0 && set.reps === 0) {
                onUpdate('weight', previousSet.weight);
                onUpdate('reps', previousSet.reps);
            } else {
                onUpdate(field, previousSet[field]);
            }
        }
        // Publish current weight so PlateCalculator can react
        if (field === 'weight') {
            const target = set.weight || previousSet?.weight || 0;
            if (target > 0) useUIStore.getState().setPlateTargetWeight(target);
        }
    };

    const handleTypeToggle = () => {
        const types: SetType[] = ['working', 'warmup', 'failure', 'drop'];
        const currentIndex = types.indexOf(set.type || 'working');
        const nextType = types[(currentIndex + 1) % types.length];
        onUpdate('type', nextType);
    };

    const getTypeStyle = (type?: SetType) => {
        switch (type) {
            case 'warmup': return "text-brand-warning bg-brand-warning/10";
            case 'failure': return "text-brand-danger bg-brand-danger/10";
            case 'drop':    return "text-brand-accent  bg-brand-accent/10";
            default:        return "text-zinc-400 bg-zinc-800/50";
        }
    };

    const getTypeLabel = (type?: SetType) => {
        switch (type) {
            case 'warmup': return "W";
            case 'failure': return "F";
            case 'drop': return "D";
            default: return String(index + 1);
        }
    };

    return (
        <>
            <div className="relative group mb-2 last:mb-0 transform-gpu">
                {/* Swipe Actions Background Layer */}
                <div className="absolute inset-0 bg-red-900/20 rounded-2xl flex items-center justify-end px-4 gap-4 z-0">
                    <button 
                        onClick={() => onClone?.()} 
                        className="w-10 h-10 bg-brand-accent/80 rounded-xl flex items-center justify-center text-white active:scale-95 transition-transform shadow-lg"
                    >
                        <Copy size={18} />
                    </button>
                    <button 
                        onClick={() => onDelete()} 
                        className="w-10 h-10 bg-brand-danger/80 rounded-xl flex items-center justify-center text-white active:scale-95 transition-transform shadow-lg"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                {/* Foreground Content - Optimized Drag */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: -100, right: 0 }}
                    dragElastic={0.05}
                    dragMomentum={false}
                    dragDirectionLock={true}
                    dragSnapToOrigin={true}
                    onDragEnd={(e, info: PanInfo) => {
                        if (info.offset.x < -100) onDelete();
                    }}
                    animate={isCompleted ? { scale: [1, 1.02, 1] } : { scale: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                        "relative z-10 flex flex-col px-3 py-2 transition-colors duration-200 will-change-transform rounded-xl border",
                        isCompleted
                            ? "bg-zinc-950 border-brand-success/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]"
                            : "bg-zinc-900 border-transparent"
                    )}
                >
                    {/* Previous Set Floating Row */}
                    {!isCompleted && previousSet && (previousSet.weight > 0 || previousSet.reps > 0) && (
                        <div 
                            onClick={() => {
                                onUpdate('weight', previousSet.weight);
                                onUpdate('reps', previousSet.reps);
                            }}
                            className="flex items-center gap-1 pl-[44px] mb-1 cursor-pointer group w-fit"
                            title="Tap to auto-fill"
                        >
                            <span className="text-[10px] font-mono text-zinc-400 group-hover:text-brand-primary transition-colors flex items-center gap-1">
                                ↑ {previousSet.weight}kg × {previousSet.reps}
                            </span>
                        </div>
                    )}

                    {/* e1RM — live estimated 1-rep max */}
                    {e1rm !== null && (
                        <div className="pl-[44px] mb-1 flex items-center gap-2">
                            <span className="text-[10px] font-mono text-zinc-500">
                                e1RM ≈ {e1rm}kg
                            </span>
                            {/* C-02: Delta badge — shown only when set is completed */}
                            {delta !== null && (
                                <span className={cn(
                                    "text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md",
                                    delta > 0 ? "text-brand-success bg-brand-success/10" :
                                    delta < 0 ? "text-red-400 bg-red-400/10" :
                                    "text-zinc-500 bg-zinc-800"
                                )}>
                                    {delta > 0 ? `+${delta}kg` : delta < 0 ? `${delta}kg` : '='}
                                </span>
                            )}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-[36px_1fr_1fr_40px_44px] gap-2 items-center">
                        {/* 1. Set Type Indicator */}
                        <div className="flex justify-center items-center h-full min-h-[44px]">
                            <button
                                onClick={handleTypeToggle}
                                className={cn(
                                    "h-8 w-8 mx-auto flex items-center justify-center rounded-md text-xs font-bold transition-colors active:scale-95",
                                    getTypeStyle(set.type)
                                )}
                            >
                                {getTypeLabel(set.type)}
                            </button>
                        </div>

                        {/* 2. Weight Input */}
                        <div className="relative flex items-center justify-center h-full min-h-[44px]">
                            {gymMode && !isCompleted ? (
                                <div className="flex items-center gap-0.5 w-full">
                                    <button
                                        onPointerDown={(e) => { e.preventDefault(); handleStep('weight', -1); }}
                                        className="w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-l-lg flex items-center justify-center text-zinc-400 active:bg-zinc-700 active:scale-95 transition-all"
                                        aria-label="Decrease weight"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <div
                                        className="flex-1 h-9 bg-zinc-800 border-y border-zinc-700 text-center text-sm font-bold text-white flex items-center justify-center cursor-pointer"
                                        onClick={() => document.getElementById(getInputId('weight'))?.focus()}
                                    >
                                        {set.weight || '—'}
                                    </div>
                                    <button
                                        onPointerDown={(e) => { e.preventDefault(); handleStep('weight', 1); }}
                                        className="w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-r-lg flex items-center justify-center text-zinc-400 active:bg-zinc-700 active:scale-95 transition-all"
                                        aria-label="Increase weight"
                                    >
                                        <Plus size={14} />
                                    </button>
                                    <input
                                        id={getInputId('weight')}
                                        type="number"
                                        inputMode="decimal"
                                        value={set.weight === 0 ? '' : set.weight}
                                        onChange={(e) => handleChange(e, 'weight')}
                                        onFocus={(e) => { handleFocus(e, 'weight'); e.target.select(); }}
                                        className="sr-only"
                                        aria-label={`Weight for set ${index + 1}`}
                                    />
                                </div>
                            ) : (
                                <input
                                    id={getInputId('weight')}
                                    type="number"
                                    inputMode="decimal"
                                    aria-label={`Weight for set ${index + 1}`}
                                    value={set.weight === 0 ? '' : set.weight}
                                    placeholder="—"
                                    onChange={(e) => handleChange(e, 'weight')}
                                    onFocus={(e) => handleFocus(e, 'weight')}
                                    className={cn(
                                        "w-full h-9 bg-zinc-800 border border-zinc-700/50 text-center text-sm font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:scale-105 placeholder:text-zinc-500 transition-all appearance-none",
                                        isCompleted ? "text-brand-success font-mono bg-transparent border-transparent" : "text-white"
                                    )}
                                />
                            )}
                        </div>

                        {/* 3. Reps Input */}
                        <div className="relative flex items-center justify-center h-full min-h-[44px]">
                            {gymMode && !isCompleted ? (
                                <div className="flex items-center gap-0.5 w-full">
                                    <button
                                        onPointerDown={(e) => { e.preventDefault(); handleStep('reps', -1); }}
                                        className="w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-l-lg flex items-center justify-center text-zinc-400 active:bg-zinc-700 active:scale-95 transition-all"
                                        aria-label="Decrease reps"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <div
                                        className="flex-1 h-9 bg-zinc-800 border-y border-zinc-700 text-center text-sm font-bold text-white flex items-center justify-center cursor-pointer"
                                        onClick={() => document.getElementById(getInputId('reps'))?.focus()}
                                    >
                                        {set.reps || '—'}
                                    </div>
                                    <button
                                        onPointerDown={(e) => { e.preventDefault(); handleStep('reps', 1); }}
                                        className="w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-r-lg flex items-center justify-center text-zinc-400 active:bg-zinc-700 active:scale-95 transition-all"
                                        aria-label="Increase reps"
                                    >
                                        <Plus size={14} />
                                    </button>
                                    <input
                                        id={getInputId('reps')}
                                        type="number"
                                        inputMode="numeric"
                                        value={set.reps === 0 ? '' : set.reps}
                                        onChange={(e) => handleChange(e, 'reps')}
                                        onFocus={(e) => { handleFocus(e, 'reps'); e.target.select(); }}
                                        className="sr-only"
                                        aria-label={`Reps for set ${index + 1}`}
                                    />
                                </div>
                            ) : (
                                <input
                                    id={getInputId('reps')}
                                    type="number"
                                    inputMode="numeric"
                                    aria-label={`Reps for set ${index + 1}`}
                                    value={set.reps === 0 ? '' : set.reps}
                                    placeholder="—"
                                    onChange={(e) => handleChange(e, 'reps')}
                                    onFocus={(e) => handleFocus(e, 'reps')}
                                    className={cn(
                                        "w-full h-9 bg-zinc-800 border border-zinc-700/50 text-center text-sm font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:scale-105 placeholder:text-zinc-500 transition-all appearance-none",
                                        isCompleted ? "text-brand-success font-mono bg-transparent border-transparent" : "text-white"
                                    )}
                                />
                            )}
                        </div>

                        {/* 4. RPE Pill */}
                        <div className="flex justify-center items-center h-full min-h-[44px]">
                            <button
                                onClick={() => setShowRpePicker(true)}
                                className={cn(
                                    "w-full h-9 rounded-lg text-[11px] font-bold flex items-center justify-center transition-colors active:scale-95 border",
                                    set.rpe === 0 ? "text-zinc-300 hover:bg-zinc-700 hover:text-white bg-zinc-800 border-zinc-700/50" :
                                    set.rpe < 7 ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
                                    set.rpe < 9 ? "text-amber-300 bg-amber-300/10 border-amber-300/20" :
                                    "text-red-400 bg-red-400/10 border-red-400/20"
                                )}
                            >
                                {set.rpe > 0 ? set.rpe : '-'}
                            </button>
                        </div>

                        {/* 5. Checkbox */}
                    <div className="flex justify-center items-center h-full min-h-[44px]">
                        <motion.button
                            onClick={(e) => { e.stopPropagation(); onComplete(); }}
                            aria-label={`Marcar set ${index + 1} completo — ${set.weight}kg × ${set.reps} reps`}
                            aria-pressed={isCompleted}
                            whileTap={{ scale: 0.9 }}
                            animate={isCompleted ? { scale: [1, 1.2, 1], backgroundColor: ["#10b981", "#10b981"] } : {}}
                            transition={{ duration: 0.4, ease: "backOut" }}
                            className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm",
                                isCompleted
                                    ? "bg-brand-success text-black"
                                    : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white"
                            )}
                        >
                            <Check size={18} strokeWidth={isCompleted ? 4 : 3} />
                        </motion.button>
                    </div>
                    </div>
                </motion.div>
            </div>

            {/* RPE Modal */}
            <RpePicker
                isOpen={showRpePicker}
                currentRpe={set.rpe}
                onSelect={(val) => onUpdate('rpe', val)}
                onClose={() => setShowRpePicker(false)}
            />
        </>
    );
};

// Optimized comparison function to prevent re-renders unless data actually changes
export default React.memo(SetRow, (prev, next) => {
    return (
        prev.set.weight === next.set.weight &&
        prev.set.reps === next.set.reps &&
        prev.set.rpe === next.set.rpe &&
        prev.set.type === next.set.type &&
        prev.set.isCompleted === next.set.isCompleted &&
        prev.index === next.index &&
        prev.previousSet?.weight === next.previousSet?.weight &&
        prev.previousSet?.reps === next.previousSet?.reps
        // gymMode is read from store directly — no prop needed
    );
});
