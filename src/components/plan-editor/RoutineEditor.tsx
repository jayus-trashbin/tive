
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
    const { routines, saveRoutine, deleteRoutine, exercises: storedExercises, setRoutineEditorOpen } = useWorkoutStore();

    // Editor State
    const [routineName, setRoutineName] = useState('');
    const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

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

    const handlePickerSelection = (exerciseIds: string[]) => {
        const newBlocks: RoutineBlock[] = exerciseIds.map(eid => ({
            id: crypto.randomUUID(),
            exerciseId: eid,
            sets: [
                // Start with ONE generic set. 
                // This allows the user to configure Set 1, then click "Add Set" to intelligently clone it.
                { id: crypto.randomUUID(), type: 'working', targetReps: '10', targetWeight: 0 }
            ],
            isSuperset: false
        }));

        setBlocks(prev => [...prev, ...newBlocks]);
        setShowPicker(false);
    };

    const handleSave = () => {
        if (!routineName.trim()) return alert("Please name your routine");
        if (blocks.length === 0) return alert("Add at least one exercise");

        saveRoutine({
            id: initialRoutineId || crypto.randomUUID(),
            name: routineName,
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
            <div className="px-4 py-4 border-b border-zinc-900 bg-black flex items-center gap-3 pt-safe z-20">
                <button onClick={onClose} className="w-10 h-10 -ml-2 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-800">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 min-w-0">
                    <input
                        value={routineName}
                        onChange={(e) => setRoutineName(e.target.value)}
                        placeholder="ROUTINE NAME"
                        className="w-full bg-transparent text-xl font-black text-white placeholder:text-zinc-700 focus:outline-none uppercase font-mono tracking-tight"
                    />
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary mt-1 font-mono">
                        <Clock size={12} />
                        <span>~{estimatedDuration} MIN</span>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="text-black font-bold text-sm bg-brand-primary px-5 py-2.5 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-transform active:translate-y-[1px] active:shadow-none uppercase tracking-wider font-mono"
                >
                    <Save size={16} /> SAVE
                </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                {blocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                            <Plus size={32} className="text-zinc-600" />
                        </div>
                        <p className="text-zinc-500 text-sm font-medium">Add exercises to build your routine</p>
                    </div>
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

                {/* Add Exercise Trigger */}
                <button
                    onClick={() => setShowPicker(true)}
                    className="w-full mt-6 py-5 border border-dashed border-zinc-800 bg-zinc-900/50 text-zinc-500 font-bold flex items-center justify-center gap-2 hover:border-brand-primary hover:text-brand-primary hover:bg-zinc-900 transition-all active:translate-y-[1px] uppercase tracking-widest text-xs font-mono"
                >
                    <Plus size={18} /> ADD EXERCISE
                </button>
            </div>

            {/* --- EXERCISE PICKER SHEET --- */}
            <ExercisePicker
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={handlePickerSelection}
                multiSelect={true}
            />
        </div>
    );

    return createPortal(content, document.body);
};

export default RoutineEditor;
