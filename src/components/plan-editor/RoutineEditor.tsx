
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useUIStore } from "../../store/useUIStore";
import { RoutineBlock } from '../../types';
import DraggableExerciseCard from './DraggableExerciseCard';
import { Plus, Save, ArrowLeft, Trash2, Clock } from 'lucide-react';
import ExercisePicker from '../exercise/ExercisePicker';
import { estimateRoutineDuration } from '../../utils/engine';

import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface Props {
    initialRoutineId?: string; // If provided, edit mode
    onClose: () => void;
}

const RoutineEditor: React.FC<Props> = ({ initialRoutineId, onClose }) => {
    const { routines, saveRoutine, deleteRoutine, exercises: storedExercises } = useWorkoutStore();
    const { setRoutineEditorOpen } = useUIStore();;

    // Editor State
    const [routineName, setRoutineName] = useState('');
    const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [globalRest, setGlobalRest] = useState(90);

    // Picker State
    const [showPicker, setShowPicker] = useState(false);

    // --- LIFECYCLE ---
    useEffect(() => {
        // Notify layout to hide navigation
        setRoutineEditorOpen(true);
        return () => setRoutineEditorOpen(false);
    }, [setRoutineEditorOpen]);

    // --- INIT DATA LOADING ---
    useEffect(() => {
        if (initialRoutineId) {
            const routine = routines.find(r => r.id === initialRoutineId);
            if (routine) {
                setRoutineName(routine.name);

                if (routine.blocks && routine.blocks.length > 0) {
                    // Modern structure
                    setBlocks(JSON.parse(JSON.stringify(routine.blocks))); // Deep copy to detach from store ref
                } else {
                    // Backward compatibility: Convert legacy IDs to blocks
                    const converted: RoutineBlock[] = routine.exerciseIds.map(eid => ({
                        id: crypto.randomUUID(),
                        exerciseId: eid,
                        sets: [
                            { id: crypto.randomUUID(), type: 'warmup', targetReps: '15' },
                            { id: crypto.randomUUID(), type: 'working', targetReps: '10' },
                            { id: crypto.randomUUID(), type: 'working', targetReps: '10' }
                        ],
                        isSuperset: false
                    }));
                    setBlocks(converted);
                }
            }
        } else {
            // New Routine Defaults
            setRoutineName('');
            setBlocks([]);
        }
    }, [initialRoutineId, routines]);

    // --- REAL-TIME ESTIMATION ---
    const estimatedDuration = useMemo(() => {
        // Create a mock routine object to feed the engine
        const mockRoutine = {
            id: 'temp',
            name: routineName,
            exerciseIds: [],
            blocks: blocks
        };
        return estimateRoutineDuration(mockRoutine);
    }, [blocks, routineName]);

    // --- DND SENSORS ---
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // Long press to drag on mobile to prevent scrolling conflict
                tolerance: 5,
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // --- HANDLERS ---

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
        if (navigator.vibrate) navigator.vibrate(10); // Haptic feedback
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (active.id !== over?.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleBlockUpdate = (blockId: string, updates: Partial<RoutineBlock>) => {
        setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, ...updates } : b));
    };

    const handleBlockRemove = (blockId: string) => {
        // No confirm needed for speed, user can just re-add or cancel changes
        setBlocks(prev => prev.filter(b => b.id !== blockId));
    };

    const handleGlobalRestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        const oldVal = globalRest;
        setGlobalRest(val);
        setBlocks(prev => prev.map(b => ({
            ...b,
            restSeconds: (b.restSeconds === oldVal || b.restSeconds === undefined) ? val : b.restSeconds
        })));
    };

    const handlePickerSelection = (exerciseIds: string[]) => {
        const newBlocks: RoutineBlock[] = exerciseIds.map(eid => {
            const ex = getExercise(eid);
            // Smart defaults based on target muscle
            const isCompound = ['chest', 'back', 'legs', 'upper legs'].includes(ex.targetMuscle);
            const isCardio = ex.targetMuscle === 'cardio';
            
            let defaultSets = [];
            if (isCardio) {
               defaultSets = [{ id: crypto.randomUUID(), type: 'working' as const, targetReps: '20 min', targetWeight: 0 }];
            } else if (isCompound) {
               defaultSets = [
                 { id: crypto.randomUUID(), type: 'working' as const, targetReps: '5', targetWeight: 0 },
                 { id: crypto.randomUUID(), type: 'working' as const, targetReps: '5', targetWeight: 0 },
                 { id: crypto.randomUUID(), type: 'working' as const, targetReps: '5', targetWeight: 0 },
                 { id: crypto.randomUUID(), type: 'working' as const, targetReps: '5', targetWeight: 0 }
               ];
            } else {
               defaultSets = [
                 { id: crypto.randomUUID(), type: 'working' as const, targetReps: '12', targetWeight: 0 },
                 { id: crypto.randomUUID(), type: 'working' as const, targetReps: '12', targetWeight: 0 },
                 { id: crypto.randomUUID(), type: 'working' as const, targetReps: '12', targetWeight: 0 }
               ];
            }

            return {
                id: crypto.randomUUID(),
                exerciseId: eid,
                sets: defaultSets,
                isSuperset: false
            };
        });

        setBlocks(prev => [...prev, ...newBlocks]);
        setShowPicker(false);
    };

    const handleSave = () => {
        let finalName = routineName.trim();
        if (blocks.length === 0) {
            useUIStore.getState().addNotification("Add at least one exercise", "error");
            return;
        }

        if (!finalName) {
            const muscles = Array.from(new Set(blocks.map(b => getExercise(b.exerciseId).targetMuscle)));
            if (muscles.length > 0) {
              finalName = `${muscles.slice(0, 2).map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ')} Workout`;
            } else {
              finalName = "New Routine";
            }
            useUIStore.getState().addNotification(`Named as: ${finalName}`, "info");
        }

        saveRoutine({
            id: initialRoutineId || crypto.randomUUID(),
            name: finalName,
            // Sync legacy ID array with current block order for compatibility
            exerciseIds: blocks.map(b => b.exerciseId),
            blocks: blocks,
            lastPerformed: undefined // Don't reset this if editing? Actually type says optional. 
        });

        onClose();
    };

    // Find exercise details helper
    const getExercise = (id: string) => {
        return storedExercises.find(e => e.id === id) || {
            id, name: 'Unknown Exercise', gifUrl: '', targetMuscle: 'cardio', fatigueFactor: 1, isUnilateral: false
        };
    };

    const content = (
        <div className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col animate-in fade-in duration-200">

            {/* Header */}
            <div className="border-b border-zinc-900 bg-black pt-safe z-20">
                {/* Row 1: Back + Name + Save */}
                <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                    <button onClick={onClose} className="w-10 h-10 shrink-0 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors">
                        <ArrowLeft size={22} />
                    </button>
                    <input
                        value={routineName}
                        onChange={(e) => setRoutineName(e.target.value)}
                        placeholder="Routine name..."
                        className="flex-1 min-w-0 bg-transparent text-lg font-bold text-white placeholder:text-zinc-600 focus:outline-none tracking-tight"
                    />
                    <button
                        onClick={handleSave}
                        className="shrink-0 text-black font-bold text-xs bg-brand-primary px-4 py-2 flex items-center gap-1.5 rounded-lg hover:brightness-110 transition-all active:scale-[0.97] uppercase tracking-wider"
                    >
                        <Save size={14} /> Save
                    </button>
                </div>

                {/* Row 2: Metadata chips */}
                <div className="flex items-center gap-3 px-4 pb-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary">
                        <Clock size={11} />
                        <span>~{estimatedDuration} min</span>
                    </div>
                    <span className="text-zinc-800">|</span>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                        <span className="uppercase tracking-wider text-[10px]">Rest</span>
                        <input 
                            type="number" 
                            value={globalRest} 
                            onChange={handleGlobalRestChange}
                            className="w-10 bg-zinc-900 text-white text-xs font-bold text-center rounded px-1 py-0.5 border border-zinc-800 focus:outline-none focus:border-brand-primary"
                        />
                        <span className="text-[10px] text-zinc-600">s</span>
                    </div>
                    {blocks.length > 0 && (
                        <>
                            <span className="text-zinc-800">|</span>
                            <div className="flex items-center gap-1.5 text-zinc-500 overflow-hidden whitespace-nowrap uppercase tracking-wider text-[10px] font-bold">
                                {Array.from(new Set(blocks.map(b => getExercise(b.exerciseId).targetMuscle))).slice(0, 3).join(' · ')}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                {blocks.length === 0 ? (
                    <button
                        onClick={() => setShowPicker(true)}
                        className="w-full flex flex-col items-center justify-center py-16 mt-4 rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/30 hover:border-brand-primary/40 hover:bg-zinc-900/60 transition-all group cursor-pointer active:scale-[0.99]"
                    >
                        <div className="w-14 h-14 bg-zinc-800 group-hover:bg-brand-primary/10 rounded-full flex items-center justify-center mb-3 border border-zinc-700 group-hover:border-brand-primary/30 transition-colors">
                            <Plus size={28} className="text-zinc-500 group-hover:text-brand-primary transition-colors" />
                        </div>
                        <p className="text-zinc-500 group-hover:text-zinc-300 text-sm font-medium transition-colors">Tap to add exercises</p>
                        <p className="text-zinc-700 text-[11px] mt-1">Build your routine</p>
                    </button>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={blocks.map(b => b.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-4">
                                {blocks.map((block, index) => (
                                    <DraggableExerciseCard
                                        key={block.id}
                                        block={block}
                                        index={index}
                                        exercise={getExercise(block.exerciseId)}
                                        onUpdate={(u) => handleBlockUpdate(block.id, u)}
                                        onRemove={() => handleBlockRemove(block.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>

                        {/* Drag Overlay for Visual Feedback */}
                        <DragOverlay>
                            {activeDragId ? (
                                <DraggableExerciseCard
                                    block={blocks.find(b => b.id === activeDragId)!}
                                    index={0}
                                    exercise={getExercise(blocks.find(b => b.id === activeDragId)!.exerciseId)}
                                    onUpdate={() => { }}
                                    onRemove={() => { }}
                                    isOverlay
                                />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}

                {/* Add Exercise Trigger — only when blocks exist */}
                {blocks.length > 0 && (
                    <button
                        onClick={() => setShowPicker(true)}
                        className="w-full mt-4 py-4 border border-dashed border-zinc-800 rounded-xl text-zinc-500 font-bold flex items-center justify-center gap-2 hover:border-brand-primary/40 hover:text-brand-primary hover:bg-zinc-900/50 transition-all active:scale-[0.99] uppercase tracking-widest text-xs"
                    >
                        <Plus size={16} /> Add Exercise
                    </button>
                )}
            </div>

            {/* --- EXERCISE PICKER SHEET --- */}
            <ExercisePicker
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={handlePickerSelection}
                multiSelect={true}
                existingExerciseIds={blocks.map(b => b.exerciseId)}
            />
        </div>
    );

    return createPortal(content, document.body);
};

export default RoutineEditor;
