import { useWorkoutStore } from './useWorkoutStore';
import { useShallow } from 'zustand/react/shallow';

// UI Selectors (now from useUIStore, but can be abstracted here if needed)
import { useUIStore } from './useUIStore';

/**
 * Granular selectors to prevent unnecessary re-renders in heavy components
 */

export const useActiveSession = () => useWorkoutStore(useShallow(state => state.activeSession));

/** Raw history including soft-deleted entries. Use only for sync/export. */
export const useSessionHistory = () => useWorkoutStore(useShallow(state => state.history));

/** Active (non-deleted) sessions — use this in all UI components. */
export const useActiveSessions = () =>
    useWorkoutStore(useShallow(state => state.history.filter(s => !s.deletedAt)));

/** Active (non-deleted) routines. */
export const useActiveRoutines = () =>
    useWorkoutStore(useShallow(state => state.routines.filter(r => !r.deletedAt)));

/** Active (non-deleted) exercises. */
export const useActiveExercises = () =>
    useWorkoutStore(useShallow(state => state.exercises.filter(e => !e.deletedAt)));

export const useRoutines = () => useWorkoutStore(useShallow(state => state.routines));
export const useExercises = () => useWorkoutStore(useShallow(state => state.exercises));
export const usePhysiology = () => useWorkoutStore(useShallow(state => state.physiology));
export const useUserStats = () => useWorkoutStore(useShallow(state => state.userStats));

// Specific selectors for heavy components
export const useDashboardData = () => useWorkoutStore(useShallow(state => ({
    history: state.history,
    routines: state.routines,
    activeSession: state.activeSession,
    userStats: state.userStats
})));

export const useWorkoutPlayerData = () => useWorkoutStore(useShallow(state => ({
    activeSession: state.activeSession,
    exercises: state.exercises,
    restTimer: state.restTimer
})));
