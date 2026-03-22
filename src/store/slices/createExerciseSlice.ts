import { StateCreator } from 'zustand';
import { WorkoutState, ExerciseSlice } from '../../types/store';

import { FALLBACK_EXERCISES } from '../../data/fallbackExercises';

export const createExerciseSlice: StateCreator<WorkoutState, [], [], ExerciseSlice> = (set) => ({
    exercises: FALLBACK_EXERCISES,

    setExercises: (exercises) => set({ exercises }),

    mergeExercises: (newExercises) => set((state) => {
        const existingIds = new Set(state.exercises.map(e => e.id));
        const toAdd = newExercises.filter(e => !existingIds.has(e.id));

        if (toAdd.length === 0) return {};

        return { exercises: [...state.exercises, ...toAdd] };
    }),

    // Changed to UPSERT: Updates existing exercise if ID matches
    addExercise: (exercise) => set((state) => {
        const index = state.exercises.findIndex(e => e.id === exercise.id);

        // If exists, update it (allows upgrading "Lite" exercises to "Heavy" details)
        if (index !== -1) {
            const updated = [...state.exercises];
            updated[index] = { ...updated[index], ...exercise, updatedAt: Date.now() };
            return { exercises: updated };
        }

        // Else add new
        return { exercises: [...state.exercises, { ...exercise, updatedAt: Date.now() }] };
    }),
});
