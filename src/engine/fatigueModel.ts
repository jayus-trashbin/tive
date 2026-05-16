import { Exercise, MuscleGroup, WorkoutSet, PhysiologyState } from '../types';
import { calculateDynamicFatigue } from '../utils/formulas';

export const MUSCLE_RECOVERY_PROFILE: Record<MuscleGroup, number> = {
  'upper legs': 24, // High CNS impact, slow repair
  'back': 22,       // Large surface area
  'chest': 18,      // Moderate
  'shoulders': 16,  // Fast twitch, recovers decent
  'lower legs': 12, // Very fast recovery (walking adaptation)
  'arms': 12,       // Small groups
  'core': 10,       // Postural, designed for endurance
  'cardio': 8       // Metabolic recovery is fast
};

export const MAX_MUSCLE_CAPACITY: Record<MuscleGroup, number> = {
    chest: 4000, back: 5000, 'upper legs': 7000, 'lower legs': 3000,
    shoulders: 2500, arms: 2000, core: 1500, cardio: 1200
};

export const MUSCLE_CONTRIBUTIONS: Record<string, Partial<Record<MuscleGroup, number>>> = {
  'chest':      { shoulders: 0.25, arms: 0.15 },
  'back':       { arms: 0.20, shoulders: 0.10 }, // rear delt
  'upper legs': { core: 0.15, 'lower legs': 0.10, back: 0.10 }, // leg drive on squat
  'shoulders':  { arms: 0.15, chest: 0.05 },     // pressing overlap
  'arms':       { shoulders: 0.05 },              // bicep curls load supinator
};

export const calculateMuscleReadiness = (
  currentFatigue: number,
  lastUpdateTimestamp: number,
  muscle: MuscleGroup
): { score: number, label: 'Prime' | 'Good' | 'Fatigued' | 'Critical' } => {

  const now = Date.now();
  const halfLife = MUSCLE_RECOVERY_PROFILE[muscle] || 18;
  const hoursPassed = (now - lastUpdateTimestamp) / (1000 * 60 * 60);

  const decayedFatigue = currentFatigue * Math.pow(0.5, hoursPassed / halfLife);

  const rawScore = 1 - (decayedFatigue / MAX_MUSCLE_CAPACITY[muscle]);
  const score = Math.max(0, Math.min(1, rawScore));

  let label: 'Prime' | 'Good' | 'Fatigued' | 'Critical' = 'Prime';
  if (score < 0.4) label = 'Critical';
  else if (score < 0.7) label = 'Fatigued';
  else if (score < 0.9) label = 'Good';

  return { score, label };
};

export const applyFatigueDecay = (physiology: PhysiologyState, now: number = Date.now()): PhysiologyState => {
    const timeSinceLastUpdate = now - physiology.lastUpdate;
    const hoursPassed = timeSinceLastUpdate / (1000 * 60 * 60);
    
    const newFatigue = { ...physiology.muscleFatigue };
    (Object.keys(newFatigue) as MuscleGroup[]).forEach(muscle => {
        const halfLife = MUSCLE_RECOVERY_PROFILE[muscle] || 18;
        const decayFactor = Math.pow(0.5, hoursPassed / halfLife);
        newFatigue[muscle] *= decayFactor;
    });

    return {
        muscleFatigue: newFatigue,
        lastUpdate: now
    };
};

export const calculateSessionFatigue = (sets: WorkoutSet[], exercises: Exercise[], basePhysiology: PhysiologyState): PhysiologyState => {
    const nextPhysiology = applyFatigueDecay(basePhysiology);

    sets.forEach((set, index) => {
        const ex = exercises.find(e => e.id === set.exerciseId);
        if (ex && ex.targetMuscle) {
            const load = set.weight * set.reps;
            const primaryImpact = calculateDynamicFatigue(load, set.rpe || 8, ex.fatigueFactor || 1, index);
            
            nextPhysiology.muscleFatigue[ex.targetMuscle] = 
                (nextPhysiology.muscleFatigue[ex.targetMuscle] || 0) + primaryImpact;

            const contributions = MUSCLE_CONTRIBUTIONS[ex.targetMuscle];
            if (contributions) {
                (Object.entries(contributions) as [MuscleGroup, number][]).forEach(([secondary, factor]) => {
                    nextPhysiology.muscleFatigue[secondary] = 
                        (nextPhysiology.muscleFatigue[secondary] || 0) + (primaryImpact * factor);
                });
            }
        }
    });

    return nextPhysiology;
};
