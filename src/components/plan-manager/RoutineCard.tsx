import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Edit2, Dumbbell, Trash2, CheckCircle2, ChevronRight, Layers, Clock, Copy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Routine, Exercise } from '../../types';
import { estimateRoutineDuration } from '../../utils/engine';

interface RoutineCardProps {
    routine: Routine;
    storedExercises: Exercise[];
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    onEdit: (id: string) => void;
    onOpenPreview: (id: string) => void;
    onDuplicate: (id: string) => void;
}

const RoutineCard: React.FC<RoutineCardProps> = ({
    routine,
    storedExercises,
    isSelectionMode,
    isSelected,
    onToggleSelection,
    onEdit,
    onOpenPreview,
    onDuplicate
}) => {

    // 1. Resolve Data
    const displayIds = routine.blocks ? routine.blocks.map(b => b.exerciseId) : routine.exerciseIds;
    // Explicit type guard for filter(Boolean) equivalent
    const resolvedExercises = displayIds
        .map(id => storedExercises.find(e => e.id === id))
        .filter((e): e is Exercise => !!e);

    // 2. Dynamic Thumbnails (Take up to 3 unique static images)
    const thumbnails = Array.from(new Set(resolvedExercises.map(e => e?.staticImageUrl || (e?.gifUrl ? `https://wsrv.nl/?url=${encodeURIComponent(e.gifUrl)}&n=1&output=png` : '')).filter(Boolean))).slice(0, 3);

    // 3. Muscle Group Tags (Top 2 most frequent)
    const muscleCounts = resolvedExercises.reduce((acc, ex) => {
        if (ex.targetMuscle) acc[ex.targetMuscle] = (acc[ex.targetMuscle] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topMuscles = Object.entries(muscleCounts)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 2)
        .map(([m]) => m);

    // 4. Accurate Duration
    const estTime = estimateRoutineDuration(routine);

    // 5. Swipe Logic
    const [isDragging, setIsDragging] = React.useState(false);

    const handleDragEnd = (event: any, info: any) => {
        setIsDragging(false);
        if (info.offset.x > 100 && !isSelectionMode) {
            onOpenPreview(routine.id);
        }
    };

    return (
        <div className="card relative w-full aspect-[2/1] group p-0 overflow-hidden cursor-pointer">

            {/* SWIPE ACTION BACKGROUND (Left/Start) */}
            <div className="absolute inset-y-0 left-0 w-full bg-brand-primary flex items-center pl-6">
                <div className="flex items-center gap-2 text-zinc-950 font-bold uppercase tracking-wider text-lg">
                    <Play size={20} fill="currentColor" />
                    Start
                </div>
            </div>

            <motion.div
                layout
                drag={!isSelectionMode ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ right: 0.5, left: 0.05 }} // Allow elastic pull to right
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                    if (isDragging) return;
                    if (isSelectionMode) {
                        onToggleSelection(routine.id);
                    } else {
                        onOpenPreview(routine.id);
                    }
                }}
                whileTap={{ cursor: "grabbing" }}
                className={cn(
                    "relative w-full h-full bg-zinc-950 transition-transform",
                    isSelected && "border-2 border-brand-primary"
                )}
                style={{ x: 0 }}
            >
                {/* A. DYNAMIC BACKGROUND MOSAIC */}
                <div className="absolute inset-0 z-0 bg-zinc-900 grid grid-cols-3 opacity-40 group-hover:opacity-20 transition-opacity pointer-events-none">
                    {thumbnails.length > 0 ? (
                        <>
                            {thumbnails.map((url, i) => (
                                <div key={i} className={cn(
                                    "relative h-full overflow-hidden grayscale",
                                    thumbnails.length === 1 && "col-span-3",
                                    thumbnails.length === 2 && "col-span-1 first:col-span-2",
                                    thumbnails.length === 3 && "col-span-1"
                                )}>
                                    <img src={url as string} loading="lazy" className="w-full h-full object-cover" />
                                </div>
                            ))}
                            {thumbnails.length < 3 && Array.from({ length: 3 - thumbnails.length }).map((_, i) => (
                                <div key={`empty-${i}`} className="bg-zinc-950 border-l border-zinc-900" />
                            ))}
                        </>
                    ) : (
                        <div className="col-span-3 bg-zinc-950 flex items-center justify-center border border-zinc-900">
                            <Dumbbell className="text-zinc-800" size={60} strokeWidth={1} />
                        </div>
                    )}
                </div>

                {/* B. GRADIENT OVERLAY */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none" />
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950/90 to-transparent pointer-events-none" />

                {/* C. CONTENT LAYER */}
                <div className="absolute inset-0 z-20 p-4 flex flex-col justify-between">
                    {/* Top Row */}
                    <div className="flex justify-between items-start">
                        {/* Muscle Pills */}
                        <div className="flex flex-wrap gap-1">
                            {topMuscles.length > 0 ? topMuscles.map(m => (
                                <span key={m} className="px-2 py-0.5 bg-brand-primary text-black text-[10px] font-bold uppercase tracking-widest rounded-full">
                                    {m}
                                </span>
                            )) : (
                                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                                    General
                                </span>
                            )}
                        </div>

                        {/* Selection Checkbox */}
                        {isSelectionMode ? (
                            <div className={cn(
                                "w-5 h-5 rounded flex items-center justify-center transition-colors bg-black border",
                                isSelected ? "bg-brand-primary border-brand-primary text-black" : "border-zinc-700 text-transparent"
                            )}>
                                <CheckCircle2 size={14} strokeWidth={3} />
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDuplicate(routine.id); }}
                                    title="Duplicate routine"
                                    className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-400/40 transition-all active:scale-95"
                                >
                                    <Copy size={12} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(routine.id); }}
                                    className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-brand-primary hover:border-brand-primary transition-all active:scale-95"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bottom Row */}
                    <div>
                        <h3 className="text-lg font-bold text-white leading-tight mb-1 tracking-tight truncate">
                            {routine.name}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                                <Layers size={12} className="text-brand-primary" />
                                {displayIds.length} EX
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={12} className="text-brand-primary" />
                                {estTime} MIN
                            </span>
                        </div>
                    </div>
                </div>

                {/* Hover Arrow */}
                {!isSelectionMode && (
                    <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                        <div className="w-10 h-10 rounded-full bg-brand-primary text-black flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                            <Play size={16} fill="currentColor" />
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default React.memo(RoutineCard);
