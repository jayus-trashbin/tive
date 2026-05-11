import { Session, Mesocycle } from '../types';

export type MesocyclePhase = 'accumulation' | 'intensification' | 'deload';

/**
 * Detects the current phase of the mesocycle based on the current week.
 * Typical 4-week block:
 * Week 1-2: Accumulation
 * Week 3: Intensification
 * Week 4: Deload
 */
export const detectCurrentPhase = (mesocycle: Mesocycle): MesocyclePhase => {
    if (!mesocycle) return 'accumulation';
    
    const { currentWeek, weeks } = mesocycle;
    
    // Last week is always deload
    if (currentWeek >= weeks) {
        return 'deload';
    }

    // Second to last week is intensification
    if (currentWeek === weeks - 1) {
        return 'intensification';
    }

    return 'accumulation';
};

/**
 * Suggests weekly volume adjustments (sets) based on the current phase
 */
export const suggestWeeklyAdjustment = (phase: MesocyclePhase, currentVolume: number): number => {
    switch (phase) {
        case 'accumulation':
            return currentVolume + 1; // Suggest adding 1 set per muscle group
        case 'intensification':
            return currentVolume;     // Keep volume, push intensity
        case 'deload':
            return Math.max(1, Math.floor(currentVolume / 2)); // Cut volume in half
        default:
            return currentVolume;
    }
};
