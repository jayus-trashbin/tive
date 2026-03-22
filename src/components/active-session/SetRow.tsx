
import React, { useState } from 'react';
import { WorkoutSet, SetType } from '../../types';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, PanInfo } from 'framer-motion';
import RpePicker from './RpePicker';

interface Props {
    index: number;
    set: WorkoutSet;
    previousSet?: WorkoutSet | null;
    onUpdate: (field: keyof WorkoutSet, value: WorkoutSet[keyof WorkoutSet]) => void;
    onComplete: () => void;
    onDelete: () => void;
    getInputId: (field: 'weight' | 'reps') => string;
}

const SetRow: React.FC<Props> = ({
    index, set, previousSet, onUpdate, onComplete, onDelete, getInputId
}) => {
    const isCompleted = set.isCompleted;
    const [showRpePicker, setShowRpePicker] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'weight' | 'reps') => {
        const val = e.target.value;
        const num = val === '' ? 0 : parseFloat(val);
        onUpdate(field, num);
    };

    const handleTypeToggle = () => {
        const types: SetType[] = ['working', 'warmup', 'failure', 'drop'];
        const currentIndex = types.indexOf(set.type || 'working');
        const nextType = types[(currentIndex + 1) % types.length];
        onUpdate('type', nextType);
    };

    const getTypeStyle = (type?: SetType) => {
        switch (type) {
            case 'warmup': return "text-brand-warning border-brand-warning/30 bg-brand-warning/10";
            case 'failure': return "text-brand-danger border-brand-danger/30 bg-brand-danger/10";
            case 'drop': return "text-purple-400 border-purple-400/30 bg-purple-400/10";
            default: return "text-zinc-400 border-zinc-700 bg-zinc-800/50";
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
                {/* Delete Background Layer - Simplified */}
                <div className="absolute inset-0 bg-red-900/20 rounded-2xl flex items-center justify-end px-6 z-0">
                    <Trash2 size={20} className="text-red-500" />
                </div>

                {/* Foreground Content - Optimized Drag */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: -100, right: 0 }}
                    dragElastic={0.05}
                    dragMomentum={false}
                    dragDirectionLock={true}
                    onDragEnd={(e, info: PanInfo) => {
                        if (info.offset.x < -80) onDelete();
                    }}
                    className={cn(
                        "relative z-10 grid gap-1.5 items-center p-1.5 rounded-2xl border transition-colors duration-200 will-change-transform",
                        "grid-cols-[36px_1fr_1fr_44px_50px]",
                        isCompleted
                            ? "bg-zinc-950 border-brand-success/30"
                            : "bg-zinc-900 border-white/5"
                    )}
                >
                    {/* 1. Set Type Indicator */}
                    <button
                        onClick={handleTypeToggle}
                        className={cn(
                            "h-full min-h-[44px] flex items-center justify-center rounded-xl text-xs font-bold font-mono border",
                            getTypeStyle(set.type)
                        )}
                    >
                        {getTypeLabel(set.type)}
                    </button>

                    {/* 2. Weight Input Island - Removed heavy shadows/transitions */}
                    <div className={cn(
                        "relative h-full min-h-[48px] rounded-xl flex flex-col justify-center px-1",
                        isCompleted ? "opacity-80" : "bg-zinc-950 border border-zinc-800"
                    )}>
                        {/* Floating Label (Hidden on small screens) */}
                        {!isCompleted && (
                            <div className="absolute top-1 right-2 text-[7px] font-bold text-zinc-600 pointer-events-none uppercase">
                                KG
                            </div>
                        )}

                        <input
                            id={getInputId('weight')}
                            type="number"
                            inputMode="decimal"
                            value={set.weight === 0 ? '' : set.weight}
                            placeholder={previousSet ? String(previousSet.weight) : '-'}
                            onChange={(e) => handleChange(e, 'weight')}
                            onFocus={(e) => e.target.select()}
                            className={cn(
                                "w-full bg-transparent text-center text-lg font-bold font-mono focus:outline-none placeholder:text-zinc-800",
                                isCompleted ? "text-brand-success" : "text-white"
                            )}
                        />
                    </div>

                    {/* 3. Reps Input Island */}
                    <div className={cn(
                        "relative h-full min-h-[48px] rounded-xl flex flex-col justify-center px-1",
                        isCompleted ? "opacity-80" : "bg-zinc-950 border border-zinc-800"
                    )}>
                        {!isCompleted && (
                            <div className="absolute top-1 right-2 text-[7px] font-bold text-zinc-600 pointer-events-none uppercase">
                                Reps
                            </div>
                        )}

                        <input
                            id={getInputId('reps')}
                            type="number"
                            inputMode="numeric"
                            value={set.reps === 0 ? '' : set.reps}
                            placeholder={previousSet ? String(previousSet.reps) : '-'}
                            onChange={(e) => handleChange(e, 'reps')}
                            onFocus={(e) => e.target.select()}
                            className={cn(
                                "w-full bg-transparent text-center text-lg font-bold font-mono focus:outline-none placeholder:text-zinc-800",
                                isCompleted ? "text-brand-success" : "text-white"
                            )}
                        />
                    </div>

                    {/* 4. RPE Pill */}
                    <div className="flex justify-center h-full">
                        <button
                            onClick={() => setShowRpePicker(true)}
                            className={cn(
                                "w-full h-full min-h-[44px] rounded-xl text-[10px] font-bold font-mono flex flex-col items-center justify-center border gap-0.5",
                                set.rpe >= 9
                                    ? "border-brand-danger/30 text-brand-danger bg-brand-danger/5"
                                    : "border-zinc-800 text-zinc-500 bg-zinc-900"
                            )}
                        >
                            <span>@{set.rpe}</span>
                        </button>
                    </div>

                    {/* 5. Checkbox (Large Touch Target) */}
                    <div className="flex justify-center h-full">
                        <button
                            onClick={(e) => { e.stopPropagation(); onComplete(); }}
                            className={cn(
                                "w-full h-full min-h-[44px] rounded-xl flex items-center justify-center active:scale-95 transition-transform",
                                isCompleted
                                    ? "bg-brand-success text-black"
                                    : "bg-zinc-800 text-zinc-600"
                            )}
                        >
                            <Check size={22} strokeWidth={isCompleted ? 4 : 3} />
                        </button>
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
        prev.index === next.index
    );
});
