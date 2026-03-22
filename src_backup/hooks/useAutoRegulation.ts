import { useState, useCallback } from 'react';
import { checkAutoRegulation } from '../utils/engine';
import { WorkoutSet } from '../types';

interface AutoRegulationResult {
    suggestion: string | null;
    dropPercent: number;
}

export const useAutoRegulation = () => {
    const [message, setMessage] = useState<string | null>(null);

    const analyzeSet = useCallback((set: WorkoutSet, targetRpe: number = 7) => {
        const regulation = checkAutoRegulation(set, targetRpe);

        if (regulation.suggestion) {
            setMessage(regulation.suggestion);
            return regulation.dropPercent;
        } else {
            setMessage(null);
            return 0;
        }
    }, []);

    const clearMessage = useCallback(() => setMessage(null), []);

    return { message, analyzeSet, clearMessage };
};
