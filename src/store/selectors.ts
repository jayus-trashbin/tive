import { useWorkoutStore } from './useWorkoutStore';
import { useShallow } from 'zustand/react/shallow';

// UI Selectors (now from useUIStore, but can be abstracted here if needed)
import { useUIStore } from './useUIStore';

/**
 * Granular selectors to prevent unnecessary re-renders in heavy components
 */

export const useActiveSession = () => useWorkoutStore(useShallow(state => state.activeSession));
export const useSessionHistory = () => useWorkoutStore(useShallow(state => state.history));
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
