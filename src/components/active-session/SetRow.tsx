
import React, { useState } from 'react';
import { WorkoutSet, SetType } from '../../types';
import { Check, Trash2, Copy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, PanInfo } from 'framer-motion';
import { getSuggestedWeight } from '../../utils/engine';
import { calculateHybrid1RM } from '../../utils/formulas';
import RpePicker from './RpePicker';

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
                    onDragEnd={(e, info: PanInfo) => {
                        // Keep open or trigger action based on distance
                        if (info.offset.x < -100) onDelete();
                    }}
                    className={cn(
                        "relative z-10 grid gap-2 items-center px-3 py-2 transition-colors duration-200 will-change-transform rounded-xl",
                        "grid-cols-[36px_1fr_48px_48px_32px_44px]",
                        isCompleted
                            ? "bg-zinc-950 border border-brand-success/30"
                            : "bg-zinc-900" // Solid background to hide swipe actions underneath
                    )}
                >
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

                    {/* 2. Previous Performance */}
                    <div 
                        className="text-[11px] text-zinc-500 font-medium truncate cursor-pointer hover:text-zinc-300 transition-colors pl-1 select-none flex items-center h-full min-h-[44px]"
                        onClick={() => {
                            if (previousSet) {
                                onUpdate('weight', previousSet.weight);
                                onUpdate('reps', previousSet.reps);
                            }
                        }}
                    >
                        {previousSet ? `${previousSet.weight}kg × ${previousSet.reps}` : '-'}
                    </div>

                    {/* 3. Weight Input */}
                    <div className="relative flex items-center justify-center h-full min-h-[44px]">
                        <input
                            id={getInputId('weight')}
                            type="number"
                            inputMode="decimal"
                            value={set.weight === 0 ? '' : set.weight}
                            placeholder="-"
                            onChange={(e) => handleChange(e, 'weight')}
                            onFocus={(e) => e.target.select()}
                            className={cn(
                                "w-full h-9 bg-zinc-800 border border-zinc-700/50 text-center text-sm font-bold rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-zinc-500 transition-all appearance-none",
                                isCompleted ? "text-brand-success bg-transparent border-transparent" : "text-white"
                            )}
                        />
                    </div>

                    {/* 4. Reps Input */}
                    <div className="relative flex items-center justify-center h-full min-h-[44px]">
                        <input
                            id={getInputId('reps')}
                            type="number"
                            inputMode="numeric"
                            value={set.reps === 0 ? '' : set.reps}
                            placeholder="-"
                            onChange={(e) => handleChange(e, 'reps')}
                            onFocus={(e) => e.target.select()}
                            className={cn(
                                "w-full h-9 bg-zinc-800 border border-zinc-700/50 text-center text-sm font-bold rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-zinc-500 transition-all appearance-none",
                                isCompleted ? "text-brand-success bg-transparent border-transparent" : "text-white"
                            )}
                        />
                    </div>

                    {/* 5. RPE Pill */}
                    <div className="flex justify-center items-center h-full min-h-[44px]">
                        <button
                            onClick={() => setShowRpePicker(true)}
                            className={cn(
                                "w-full h-9 rounded-lg text-[11px] font-bold flex items-center justify-center transition-colors active:scale-95 border",
                                set.rpe >= 9
                                    ? "text-red-400 bg-red-400/10 border-red-400/20"
                                    : "text-zinc-300 hover:bg-zinc-700 hover:text-white bg-zinc-800 border-zinc-700/50"
                            )}
                        >
                            {set.rpe > 0 ? set.rpe : '-'}
                        </button>
                    </div>

                    {/* 6. Checkbox */}
                    <div className="flex justify-center items-center h-full min-h-[44px]">
                        <button
                            onClick={(e) => { e.stopPropagation(); onComplete(); }}
                            aria-label={`Marcar set ${index + 1} completo — ${set.weight}kg × ${set.reps} reps`}
                            aria-pressed={isCompleted}
                            className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm",
                                isCompleted
                                    ? "bg-brand-success text-black"
                                    : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white"
                            )}
                        >
                            <Check size={18} strokeWidth={isCompleted ? 4 : 3} />
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
