import { useCallback } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useHaptic } from './useHaptic';
import { WorkoutSet, SetType } from '../types';
import { usePhysiology } from './usePhysiology';
import { audio } from '../utils/audio';
import { getPreviousSetPerformance, getSuggestedWeight } from '../utils/engine';

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
            // Copy last set from current session exactly
            const last = currentSets[currentSets.length - 1];
            defaultWeight = last.weight;
            defaultReps = last.reps;
            defaultRpe = last.rpe;
            defaultType = last.type || 'working';
        } else {
            // Try to find historical data using the engine
            const lastPerf = getPreviousSetPerformance(history, currentSession.routineId, exerciseId, 0);
            if (lastPerf) {
                defaultWeight = getSuggestedWeight(lastPerf) || lastPerf.weight;
                defaultReps = lastPerf.reps;
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

    // 1.5 CLONE SET
    const handleCloneSet = useCallback((sourceSet: WorkoutSet) => {
        const newSet: WorkoutSet = {
            ...sourceSet,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            isCompleted: false
        };
        logSet(newSet);
    }, [logSet]);

    // 1.8 GENERATE WARMUPS
    const handleGenerateWarmups = useCallback((exerciseId: string, targetWeight: number) => {
        if (targetWeight <= 20) {
            haptic('error');
            return; // No warmups needed for very light weight
        }

        const roundTo2_5 = (w: number) => Math.round(w / 2.5) * 2.5;

        // Steps: Bar (20), 50%, 75%
        const steps = [
            { weight: 20, reps: 10 },
            { weight: Math.max(20, roundTo2_5(targetWeight * 0.5)), reps: 5 },
            { weight: Math.max(20, roundTo2_5(targetWeight * 0.75)), reps: 3 }
        ];

        // Filter valid steps (strictly increasing and less than target)
        const uniqueSteps = steps.filter((step, i, arr) => 
            step.weight < targetWeight && 
            (i === 0 || step.weight > arr[i-1].weight)
        );

        if (uniqueSteps.length === 0) return;

        const warmups: WorkoutSet[] = uniqueSteps.map(step => ({
            id: crypto.randomUUID(),
            exerciseId,
            weight: step.weight,
            reps: step.reps,
            rpe: 8,
            type: 'warmup',
            timestamp: Date.now(),
            estimated1RM: calculate1RM(step.weight, step.reps, 8),
            isCompleted: false
        }));

        useWorkoutStore.getState().addWarmupSets(exerciseId, warmups);
        haptic('success');
    }, [calculate1RM, haptic]);

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
        handleCloneSet,
        handleGenerateWarmups,
        handleUpdateSet,
        handleCompleteSet,
        handleDeleteSet: deleteSet,
        getInputId
    };
};
