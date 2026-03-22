import { useCallback } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useHaptic } from './useHaptic';
import { WorkoutSet, SetType } from '../types';
import { usePhysiology } from './usePhysiology';
import { audio } from '../utils/audio';

export const useWorkoutLogic = () => {
    const { activeSession, updateSet, logSet, toggleSetComplete, deleteSet, history } = useWorkoutStore();
    const { trigger: haptic } = useHaptic();
    const { calculate1RM } = usePhysiology();

    // Helper to generate a predictable DOM ID for inputs
    const getInputId = (exerciseId: string, setIndex: number, field: 'weight' | 'reps') => {
        return `input-${exerciseId}-${setIndex}-${field}`;
    };

    // 1. ADD SET (Smart Defaults)
    const handleAddSet = useCallback((exerciseId: string) => {
        // Get latest state directly to ensure fresh data
        const currentSession = useWorkoutStore.getState().activeSession;
        if (!currentSession) return;

        // Find previous sets for this exercise in THIS session
        const currentSets = currentSession.sets.filter(s => s.exerciseId === exerciseId);
        let defaultWeight = 0;
        let defaultReps = 0;
        let defaultRpe = 8;
        let defaultType: SetType = 'working';

        if (currentSets.length > 0) {
            // Copy last set
            const last = currentSets[currentSets.length - 1];
            defaultWeight = last.weight;
            defaultReps = last.reps;
            defaultRpe = last.rpe;
            defaultType = last.type || 'working';
        } else {
            // Try to find historical data
            const lastSession = history.find(s => s.sets.some(k => k.exerciseId === exerciseId));
            if (lastSession) {
                const histSets = lastSession.sets.filter(k => k.exerciseId === exerciseId);
                const last = histSets[histSets.length - 1];
                if (last) {
                    defaultWeight = last.weight;
                    defaultReps = last.reps;
                }
            }
        }

        const newSet: WorkoutSet = {
            id: crypto.randomUUID(),
            exerciseId,
            weight: defaultWeight,
            reps: defaultReps,
            rpe: defaultRpe,
            type: defaultType,
            timestamp: Date.now(),
            estimated1RM: calculate1RM(defaultWeight, defaultReps, defaultRpe),
            isCompleted: false
        };

        logSet(newSet);
    }, [history, logSet, calculate1RM]);

    // 2. UPDATE SET (Inline Editing)
    const handleUpdateSet = useCallback((setId: string, field: keyof WorkoutSet, value: WorkoutSet[keyof WorkoutSet]) => {
        updateSet(setId, { [field]: value });
    }, [updateSet]);

    // 3. COMPLETE SET (Checkmark Logic + Auto-Advance + CASCADE FILL)
    const handleCompleteSet = useCallback((set: WorkoutSet, exerciseId: string, setIndex: number, totalExercises: string[]) => {
        const isCompleting = !set.isCompleted;

        // Toggle State
        toggleSetComplete(set.id, isCompleting);

        if (isCompleting) {
            // Haptics - slightly stronger for feedback on Android
            haptic('success');

            // --- CASCADE FILL LOGIC ---
            // If the NEXT set exists and is "empty" (0 weight/reps), auto-fill it with THIS set's values.
            const currentSession = useWorkoutStore.getState().activeSession;
            if (currentSession) {
                const setsOfEx = currentSession.sets.filter(s => s.exerciseId === exerciseId);
                const nextSet = setsOfEx[setIndex + 1];

                if (nextSet && !nextSet.isCompleted && (nextSet.weight === 0 || nextSet.reps === 0)) {
                    updateSet(nextSet.id, {
                        weight: set.weight,
                        reps: set.reps,
                        rpe: set.rpe // Optional: copy RPE too
                    });
                }
            }

            // --- AUTO ADVANCE LOGIC (SCROLL ONLY, NO FOCUS) ---
            // 1. Try to SCROLL TO next set of SAME exercise
            const nextSetId = getInputId(exerciseId, setIndex + 1, 'weight');
            const nextElement = document.getElementById(nextSetId);

            if (nextElement) {
                // Smoothly scroll the next set into view so the user sees it
                // We removed .focus() to prevent keyboard from popping up
                nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // 2. No next set? Try first set of NEXT exercise (Scroll to header)
                const currentExIdx = totalExercises.indexOf(exerciseId);
                if (currentExIdx !== -1 && currentExIdx < totalExercises.length - 1) {
                    const nextExId = totalExercises[currentExIdx + 1];

                    const nextExGroup = document.getElementById(`group-${nextExId}`);
                    if (nextExGroup) {
                        nextExGroup.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } else {
                    // End of workout? Blur any active inputs to close keyboard if open
                    if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                    }
                }
            }
        }
    }, [toggleSetComplete, updateSet, history, getInputId]);

    return {
        handleAddSet,
        handleUpdateSet,
        handleCompleteSet,
        handleDeleteSet: deleteSet,
        getInputId
    };
};
