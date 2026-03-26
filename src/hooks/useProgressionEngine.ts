
import { useMemo } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import {
    getExerciseProgressStatus,
    getPlateauSuggestions,
    ExerciseProgressStatus,
    PlateauSuggestion
} from '../utils/engine';

/**
 * E-01 / E-02 – Progression Engine hook.
 *
 * Exposes per-exercise status and plateau suggestions,
 * memoized to avoid re-computing on every render.
 */
export const useProgressionEngine = (exerciseId: string): {
    status: ExerciseProgressStatus;
    suggestions: PlateauSuggestion[];
} => {
    const history = useWorkoutStore(state => state.history);

    const status = useMemo(
        () => getExerciseProgressStatus(history, exerciseId),
        // Re-compute only when the number of completed sessions changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [history.length, exerciseId]
    );

    const suggestions = useMemo(
        () => getPlateauSuggestions(status),
        [status.status, exerciseId]
    );

    return { status, suggestions };
};
