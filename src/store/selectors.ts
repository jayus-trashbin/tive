import React from 'react';
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
export const useActiveSessions = () => {
    const history = useWorkoutStore(state => state.history);
    // Memoize the filter based on the history array reference
    return React.useMemo(() => history.filter(s => !s.deletedAt), [history]);
};

/** Active (non-deleted) routines. */
export const useActiveRoutines = () => {
    const routines = useWorkoutStore(state => state.routines);
    return React.useMemo(() => routines.filter(r => !r.deletedAt), [routines]);
};

/** Active (non-deleted) exercises. */
export const useActiveExercises = () => {
    const exercises = useWorkoutStore(state => state.exercises);
    return React.useMemo(() => exercises.filter(e => !e.deletedAt), [exercises]);
};

export const useRoutines = () => useWorkoutStore(useShallow(state => state.routines));
export const useExercises = () => useWorkoutStore(useShallow(state => state.exercises));
export const usePhysiology = () => useWorkoutStore(useShallow(state => state.physiology));
export const useUserStats = () => useWorkoutStore(useShallow(state => state.userStats));

// Specific selectors for heavy components

export const useDashboardData = () => useWorkoutStore(useShallow(state => ({
    routines: state.routines,
    activeSession: state.activeSession,
    userStats: state.userStats
})));

export const useHistorySummary = () => useWorkoutStore(useShallow(state => {
    const valid = state.history.filter(s => !s.deletedAt && s.isCompleted);
    return {
        count: valid.length,
        lastSessionDate: valid.length > 0 ? Math.max(...valid.map(s => s.date)) : null
    };
}));

export const useAnalyticsData = () => useWorkoutStore(useShallow(state => ({
    history: state.history,
    exercises: state.exercises,
    userStats: state.userStats
})));

export const useWorkoutPlayerData = () => useWorkoutStore(useShallow(state => ({
    activeSession: state.activeSession,
    exercises: state.exercises,
    restTimer: state.restTimer
})));
