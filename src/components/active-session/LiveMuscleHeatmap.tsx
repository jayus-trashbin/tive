import React, { useMemo } from 'react';
import { MuscleGroup } from '../../types/domain';
import { WorkoutSet, Exercise } from '../../types';

interface LiveMuscleHeatmapProps {
    sets: WorkoutSet[];
    exercises: Exercise[];
    size?: number;
}

// Mapping: muscle group → { front/back side, polygon path for filled region }
const MUSCLE_REGIONS: Record<MuscleGroup, {
    side: 'front' | 'back' | 'both';
    paths: string[];
}> = {
    chest: {
        side: 'front',
        paths: ['M34,24 L46,22 L50,28 L46,35 L34,35 Z', 'M66,24 L54,22 L50,28 L54,35 L66,35 Z']
    },
    back: {
        side: 'back',
        paths: ['M36,22 L50,20 L64,22 L64,40 L50,42 L36,40 Z']
    },
    shoulders: {
        side: 'front',
        paths: ['M28,20 L36,18 L36,28 L28,26 Z', 'M72,20 L64,18 L64,28 L72,26 Z']
    },
    arms: {
        side: 'front',
        paths: ['M24,28 L32,26 L32,50 L24,48 Z', 'M76,28 L68,26 L68,50 L76,48 Z']
    },
    core: {
        side: 'front',
        paths: ['M40,36 L60,36 L58,56 L42,56 Z']
    },
    'upper legs': {
        side: 'front',
        paths: ['M38,58 L48,56 L48,78 L36,78 Z', 'M62,58 L52,56 L52,78 L64,78 Z']
    },
    'lower legs': {
        side: 'front',
        paths: ['M37,80 L47,80 L46,96 L38,96 Z', 'M63,80 L53,80 L54,96 L62,96 Z']
    },
    cardio: {
        side: 'front',
        paths: ['M46,26 L54,26 L54,32 L46,32 Z'] // Heart area
    },
};

/**
 * Compact inline muscle heatmap for the active workout session.
 * Shows a simplified body outline with highlighted muscle regions
 * that get brighter based on volume (set count per muscle).
 */
const LiveMuscleHeatmap: React.FC<LiveMuscleHeatmapProps> = ({
    sets, exercises, size = 52
}) => {
    // Calculate volume per muscle group from completed sets
    const muscleVolumes = useMemo(() => {
        const volumes = new Map<MuscleGroup, number>();
        const completedSets = sets.filter(s => s.isCompleted);

        const exerciseMap = new Map(exercises.map(e => [e.id, e]));

        completedSets.forEach(s => {
            const exercise = exerciseMap.get(s.exerciseId);
            if (!exercise) return;

            const muscle = exercise.targetMuscle;
            const vol = s.weight * s.reps;
            volumes.set(muscle, (volumes.get(muscle) || 0) + vol);

            // Secondary muscles get partial credit
            if (exercise.secondaryMuscles) {
                exercise.secondaryMuscles.forEach((sm: string) => {
                    const mapped = mapSecondaryMuscle(sm);
                    if (mapped) {
                        volumes.set(mapped, (volumes.get(mapped) || 0) + vol * 0.3);
                    }
                });
            }
        });

        return volumes;
    }, [sets, exercises]);

    // Normalize volumes to 0-1 intensity range
    const maxVolume = useMemo(() => {
        let max = 0;
        muscleVolumes.forEach(v => { if (v > max) max = v; });
        return max || 1;
    }, [muscleVolumes]);

    if (muscleVolumes.size === 0) return null;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0"
        >
            {/* Body silhouette outline */}
            <g stroke="#27272a" strokeWidth="0.8" fill="none">
                {/* Head */}
                <ellipse cx="50" cy="10" rx="8" ry="9" />
                {/* Neck */}
                <rect x="46" y="18" width="8" height="4" />
                {/* Torso */}
                <path d="M36,22 L64,22 L66,56 L34,56 Z" />
                {/* Left Arm */}
                <path d="M28,22 L36,22 L34,50 L24,50 Z" />
                {/* Right Arm */}
                <path d="M72,22 L64,22 L66,50 L76,50 Z" />
                {/* Left Leg */}
                <path d="M34,56 L48,56 L46,96 L36,96 Z" />
                {/* Right Leg */}
                <path d="M66,56 L52,56 L54,96 L64,96 Z" />
            </g>

            {/* Active muscle regions */}
            {Array.from(muscleVolumes.entries()).map(([muscle, volume]) => {
                const region = MUSCLE_REGIONS[muscle];
                if (!region) return null;
                const intensity = Math.min(1, (volume / maxVolume) * 0.8 + 0.2);

                return region.paths.map((path, i) => (
                    <path
                        key={`${muscle}-${i}`}
                        d={path}
                        fill={`rgba(163, 230, 53, ${intensity})`}
                        stroke={`rgba(163, 230, 53, ${intensity * 0.5})`}
                        strokeWidth="0.5"
                    />
                ));
            })}
        </svg>
    );
};

// Map ExerciseDB secondary muscle names to our MuscleGroup type
function mapSecondaryMuscle(name: string): MuscleGroup | null {
    const lower = name.toLowerCase();
    if (['biceps', 'triceps', 'forearms', 'brachialis'].includes(lower)) return 'arms';
    if (['pectoralis major', 'chest', 'serratus anterior'].includes(lower)) return 'chest';
    if (['lats', 'rhomboids', 'trapezius', 'rear deltoids', 'erector spinae', 'lower back'].includes(lower)) return 'back';
    if (['deltoids', 'front deltoids', 'lateral deltoids'].includes(lower)) return 'shoulders';
    if (['abs', 'obliques', 'rectus abdominis', 'transverse abdominis'].includes(lower)) return 'core';
    if (['quads', 'quadriceps', 'hamstrings', 'glutes', 'hip flexors', 'adductors', 'abductors'].includes(lower)) return 'upper legs';
    if (['calves', 'soleus', 'gastrocnemius', 'tibialis anterior'].includes(lower)) return 'lower legs';
    return null;
}

export default LiveMuscleHeatmap;
