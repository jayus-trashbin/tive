import React, { useState, useMemo } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Routine } from '../types/domain';
import { Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoutineEditor from './plan-editor/RoutineEditor';
import RoutinePreviewScreen from './pre-workout/RoutinePreviewScreen';
import AIRoutineBuilder from './ai/AIRoutineBuilder';
import {
    PlanHeader,
    SelectionBar,
    RoutineCard,
    RoutineImporter
} from './plan-manager';
import EmptyState from './ui/EmptyState';

interface Props {
    onStartSession: (routineId: string) => void;
}

/**
 * Plan Manager — Mission Control
 * 
 * Modularized redesign:
 * - PlanHeader (Actions + Title)
 * - SelectionBar (Bulk Actions)
 * - RoutineCard (Individual Items)
 */
const PlanManager: React.FC<Props> = ({ onStartSession }) => {
    const { routines, exercises: storedExercises, setRoutinePreviewOpen, deleteRoutines, saveRoutine } = useWorkoutStore();

    const visibleRoutines = useMemo(() =>
        routines.filter(r => !r.deletedAt).sort((a, b) => (b.lastPerformed || 0) - (a.lastPerformed || 0)),
        [routines]);

    // View State
    const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [previewRoutineId, setPreviewRoutineId] = useState<string | null>(null);

    // Selection Mode State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedRoutineIds, setSelectedRoutineIds] = useState<Set<string>>(new Set());

    const [showImporter, setShowImporter] = useState(false);
    const [showAIBuilder, setShowAIBuilder] = useState(false);

    const handleOpenPreview = (id: string) => {
        setPreviewRoutineId(id);
        setRoutinePreviewOpen(true);
    };

    const handleClosePreview = () => {
        setPreviewRoutineId(null);
        setRoutinePreviewOpen(false);
    };

    const handleEditFromPreview = () => {
        if (!previewRoutineId) return;
        const idToEdit = previewRoutineId;
        handleClosePreview();
        setEditingRoutineId(idToEdit);
    };

    const handleCloseEditor = () => {
        setIsCreating(false);
        setEditingRoutineId(null);
    };

    const toggleSelectionMode = () => {
        if (isSelectionMode) {
            setIsSelectionMode(false);
            setSelectedRoutineIds(new Set());
        } else {
            setIsSelectionMode(true);
        }
    };

    const toggleRoutineSelection = (id: string) => {
        setSelectedRoutineIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleImportedRoutine = (routine: Routine) => {
        saveRoutine(routine);
        setShowImporter(false);
        setShowAIBuilder(false);
    };

    const handleBulkDelete = () => {
        if (selectedRoutineIds.size === 0) return;
        if (confirm(`Delete ${selectedRoutineIds.size} routines?`)) {
            deleteRoutines(Array.from(selectedRoutineIds));
            setIsSelectionMode(false);
            setSelectedRoutineIds(new Set());
        }
    };

    // R-01: Deep clone routine with fresh IDs
    const handleDuplicate = (id: string) => {
        const source = routines.find(r => r.id === id);
        if (!source) return;
        const clonedBlocks = source.blocks?.map(b => ({
            ...b,
            id: crypto.randomUUID(),
            sets: b.sets.map(s => ({ ...s, id: crypto.randomUUID() }))
        }));
        saveRoutine({
            ...source,
            id: crypto.randomUUID(),
            name: `${source.name} (Copy)`,
            blocks: clonedBlocks,
            exerciseIds: clonedBlocks?.map(b => b.exerciseId) ?? source.exerciseIds,
            lastPerformed: undefined,
            updatedAt: Date.now(),
            _synced: false,
        });
    };

    if (previewRoutineId) {
        return (
            <RoutinePreviewScreen
                routineId={previewRoutineId}
                onBack={handleClosePreview}
                onBegin={() => {
                    onStartSession(previewRoutineId);
                    handleClosePreview();
                }}
                onEdit={handleEditFromPreview}
            />
        );
    }

    if (isCreating || editingRoutineId) {
        return (
            <RoutineEditor
                initialRoutineId={editingRoutineId || undefined}
                onClose={handleCloseEditor}
            />
        );
    }

    const routineCardVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-black">
            <PlanHeader 
                isSelectionMode={isSelectionMode}
                toggleSelectionMode={toggleSelectionMode}
                onShowAIBuilder={() => setShowAIBuilder(true)}
                onShowImporter={() => setShowImporter(true)}
                onStartCreate={() => setIsCreating(true)}
                hasRoutines={visibleRoutines.length > 0}
            />

            <AnimatePresence>
                {isSelectionMode && (
                    <SelectionBar 
                        selectedCount={selectedRoutineIds.size} 
                        onDelete={handleBulkDelete}
                    />
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto px-5 pb-32 no-scrollbar scroll-smooth">
                {visibleRoutines.length === 0 ? (
                    <EmptyState
                        icon={Dumbbell}
                        title="No Routines Yet"
                        description="Build your first workout plan to get started"
                        action={{
                            label: "Create First Routine",
                            onClick: () => setIsCreating(true)
                        }}
                    />
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { opacity: 0 },
                            show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                        }}
                        className="grid gap-3 mt-5"
                    >
                        <AnimatePresence>
                            {visibleRoutines.map(routine => (
                                <motion.div key={routine.id} variants={routineCardVariants}>
                                    <RoutineCard
                                        routine={routine}
                                        storedExercises={storedExercises}
                                        isSelectionMode={isSelectionMode}
                                        isSelected={selectedRoutineIds.has(routine.id)}
                                        onToggleSelection={toggleRoutineSelection}
                                        onEdit={setEditingRoutineId}
                                        onOpenPreview={handleOpenPreview}
                                        onDuplicate={handleDuplicate}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {showImporter && (
                    <RoutineImporter
                        isOpen={showImporter}
                        onClose={() => setShowImporter(false)}
                        onImported={handleImportedRoutine}
                    />
                )}
                {showAIBuilder && (
                    <AIRoutineBuilder
                        onClose={() => setShowAIBuilder(false)}
                        onImport={handleImportedRoutine}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlanManager;
