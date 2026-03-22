import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WorkoutState } from '../types/store';
import { idbStorage } from '../utils/storage';
import { syncService } from '../services/SyncService';
import { createSessionSlice } from './slices/createSessionSlice';
import { createExerciseSlice } from './slices/createExerciseSlice';
import { createRoutineSlice } from './slices/createRoutineSlice';
import { createUISlice } from './slices/createUISlice';
import { createPhotoSlice } from './slices/createPhotoSlice';

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (...a) => ({
      ...createSessionSlice(...a),
      ...createExerciseSlice(...a),
      ...createRoutineSlice(...a),
      ...createUISlice(...a),
      ...createPhotoSlice(...a),
    }),
    {
      name: 'adaptive-strength-pro-db',
      storage: createJSONStorage(() => idbStorage),
      version: 8,

      partialize: (state) => ({
        history: state.history,
        activeSession: state.activeSession,
        exercises: state.exercises,
        routines: state.routines,
        userStats: state.userStats,
        physiology: state.physiology,
        restTimer: state.restTimer
      }),

      onRehydrateStorage: () => (state) => {
        return (rehydratedState: any, error: any) => {
          if (error) console.error("Hydration Failed", error);
          state?.setHasHydrated(true);
          state?.setProfileOpen(false);
          state?.setRoutineEditorOpen(false);
          state?.setRoutinePreviewOpen(false);

          if (typeof window !== 'undefined') {
            if ('requestIdleCallback' in window) {
              window.requestIdleCallback(() => syncService.sync(), { timeout: 2000 });
            } else {
              setTimeout(() => syncService.sync(), 500);
            }
          }
        }
      },
    }
  )
);
