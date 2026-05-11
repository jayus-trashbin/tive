import { MuscleGroup } from '../types';

export type VolumeZone = 'below_mev' | 'mev' | 'mav' | 'mrv' | 'over_mrv';

export interface MuscleVolumeLandmarks {
    mev: number; // Minimum Effective Volume
    mavMin: number; // Maximum Adaptive Volume (Start)
    mavMax: number; // Maximum Adaptive Volume (End)
    mrv: number; // Maximum Recoverable Volume
}

/**
 * Volume Landmarks (Sets per Week)
 * Based loosely on Renaissance Periodization (RP) guidelines.
 * Note: These are rough averages and vary wildly by individual and intensity.
 */
export const VOLUME_LANDMARKS: Record<MuscleGroup, MuscleVolumeLandmarks> = {
    'chest': { mev: 8, mavMin: 12, mavMax: 20, mrv: 22 },
    'back': { mev: 10, mavMin: 14, mavMax: 22, mrv: 25 },
    'upper legs': { mev: 8, mavMin: 12, mavMax: 18, mrv: 20 },
    'lower legs': { mev: 8, mavMin: 12, mavMax: 16, mrv: 20 },
    'shoulders': { mev: 8, mavMin: 16, mavMax: 22, mrv: 26 },
    'arms': { mev: 6, mavMin: 10, mavMax: 14, mrv: 18 }, // Biceps/Triceps often get indirect work
    'core': { mev: 0, mavMin: 4, mavMax: 10, mrv: 16 }, // Heavily worked indirectly
    'cardio': { mev: 2, mavMin: 4, mavMax: 8, mrv: 12 }
};

export const getVolumeZone = (muscle: MuscleGroup, weeklySetCount: number): VolumeZone => {
    const landmarks = VOLUME_LANDMARKS[muscle];
    if (!landmarks) return 'mev'; // Safe default

    if (weeklySetCount < landmarks.mev) return 'below_mev';
    if (weeklySetCount >= landmarks.mev && weeklySetCount < landmarks.mavMin) return 'mev';
    if (weeklySetCount >= landmarks.mavMin && weeklySetCount <= landmarks.mavMax) return 'mav';
    if (weeklySetCount > landmarks.mavMax && weeklySetCount <= landmarks.mrv) return 'mrv';
    return 'over_mrv';
};

export const getVolumeZoneColor = (zone: VolumeZone): string => {
    switch (zone) {
        case 'below_mev': return 'text-zinc-500';
        case 'mev': return 'text-blue-400';
        case 'mav': return 'text-brand-success';
        case 'mrv': return 'text-brand-warning';
        case 'over_mrv': return 'text-brand-danger';
    }
};

export const getVolumeZoneLabel = (zone: VolumeZone): string => {
    switch (zone) {
        case 'below_mev': return 'Maintenance (Below MEV)';
        case 'mev': return 'Minimum Effective (MEV)';
        case 'mav': return 'Optimal Growth (MAV)';
        case 'mrv': return 'Max Recoverable (MRV)';
        case 'over_mrv': return 'Overtraining (Over MRV)';
    }
};
