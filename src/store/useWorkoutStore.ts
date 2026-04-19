import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WorkoutState } from '../types/store';
import { idbStorage } from '../utils/storage';
import { syncService } from '../services/SyncService';
import { credentialsStore } from '../utils/credentialsStore';
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
      version: 9,
      migrate: (persistedState: any, version: number) => {
        // D-01: Robust migration and fallback logic
        const state = { ...persistedState };

        // Ensure arrays exist to prevent UI crashes (map/filter undefined errors)
        state.routines = Array.isArray(state.routines) ? state.routines : [];
        state.exercises = Array.isArray(state.exercises) ? state.exercises : [];
        state.history = Array.isArray(state.history) ? state.history : [];
        state.photos = Array.isArray(state.photos) ? state.photos : [];

        // Handle migration from previous versions
        if (version < 8) {
          if (!state.userStats) {
             state.userStats = {
                name: '', email: '', isOnboarded: false, bodyweight: 80, gender: 'male', 
                wilksScore: 0, supabaseUrl: '', supabaseKey: '', unitSystem: 'metric', theme: 'dark'
             };
          }
          if (!state.physiology) {
             state.physiology = {
                muscleFatigue: { chest: 0, back: 0, 'upper legs': 0, 'lower legs': 0, shoulders: 0, arms: 0, core: 0, cardio: 0 },
                lastUpdate: Date.now()
             };
          }
        }

        if (version < 9) {
          // Initialize newly added fields in v9
          if (state.userStats && !state.userStats.theme) state.userStats.theme = 'dark';
          if (state.userStats && !state.userStats.unitSystem) state.userStats.unitSystem = 'metric';
        }

        return state;
      },

      partialize: (state) => ({
        history: state.history,
        activeSession: state.activeSession,
        exercises: state.exercises,
        routines: state.routines,
        // Credentials (supabaseKey, geminiApiKey) are excluded from IDB persistence
        // and stored separately via credentialsStore to avoid plaintext leaks in exports.
        userStats: {
          ...state.userStats,
          supabaseKey: '',
          geminiApiKey: '',
        },
        physiology: state.physiology,
        restTimer: state.restTimer
      }),

      onRehydrateStorage: () => (state) => {
        return (rehydratedState: any, error: any) => {
          if (error) console.error("Hydration Failed", error);
          // Restore credentials from separate store after hydration
          const supabaseUrl = credentialsStore.getSupabaseUrl();
          const supabaseKey = credentialsStore.getSupabaseKey();
          const geminiApiKey = credentialsStore.getGeminiKey();
          if (supabaseUrl || supabaseKey || geminiApiKey) {
            state?.updateUserStats({ supabaseUrl, supabaseKey, geminiApiKey });
          }
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
