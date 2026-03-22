
import { MuscleGroup } from '../types';

export interface PlateInventory {
  [weight: number]: number; // weight -> count
}

// --- BIOLOGICAL CONSTANTS ---

// Recovery Half-Life (Hours): Time for fatigue to drop by 50%
// Large muscles/CNS heavy lifts take longer. Small muscles recover fast.
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

const MAX_MUSCLE_CAPACITY = 10000;

/**
 * Calculates the current readiness (0.0 to 1.0) of a muscle group
 * based on its specific biological decay rate.
 */
export const calculateMuscleReadiness = (
  currentFatigue: number,
  lastUpdateTimestamp: number,
  muscle: MuscleGroup
): { score: number, label: 'Prime' | 'Good' | 'Fatigued' | 'Critical' } => {

  const now = Date.now();
  const halfLife = MUSCLE_RECOVERY_PROFILE[muscle] || 18;
  const hoursPassed = (now - lastUpdateTimestamp) / (1000 * 60 * 60);

  // Exponential Decay Formula: N(t) = N0 * (0.5)^(t / half_life)
  const decayedFatigue = currentFatigue * Math.pow(0.5, hoursPassed / halfLife);

  // Normalize to 0-1 range (1 = Fresh, 0 = Destroyed)
  // We clamp fatigue at MAX_MUSCLE_CAPACITY logic
  const rawScore = 1 - (decayedFatigue / MAX_MUSCLE_CAPACITY);
  const score = Math.max(0, Math.min(1, rawScore));

  let label: 'Prime' | 'Good' | 'Fatigued' | 'Critical' = 'Prime';
  if (score < 0.4) label = 'Critical';
  else if (score < 0.7) label = 'Fatigued';
  else if (score < 0.9) label = 'Good';

  return { score, label };
};

/**
 * Hybrid 1RM Formula
 * Combines Brzycki (low reps), Epley (mid reps), and Wathan (high reps)
 * normalization to failure via RPE projection.
 */
export const calculateHybrid1RM = (weight: number, reps: number, rpe: number = 10): number => {
  if (weight <= 0 || reps <= 0) return 0;

  // 1. Normalize "Reps to Failure" (Effective Reps)
  // RPE 10 = 0 RIR (Reps In Reserve)
  // RPE 8 = 2 RIR
  const rir = Math.max(0, 10 - rpe);
  const effectiveReps = reps + rir;

  let oneRM = 0;

  if (effectiveReps < 6) {
    // Brzycki: More accurate for strength blocks
    oneRM = weight * (36 / (37 - effectiveReps));
  } else if (effectiveReps <= 12) {
    // Epley: The gold standard for hypertrophy ranges
    oneRM = weight * (1 + effectiveReps / 30);
  } else {
    // Wathan: Dampens estimation for endurance sets (prevents inflation)
    const exponent = -0.075 * effectiveReps;
    const denominator = 48.8 + (53.8 * Math.exp(exponent));
    oneRM = (100 * weight) / denominator;
  }

  const result = Math.round(oneRM * 10) / 10;
  return isFinite(result) ? result : 0;
};

/**
 * Dynamic Fatigue Calculation
 * Models "Systemic Drag": Later sets in a session induce disproportionately more fatigue.
 */
export const calculateDynamicFatigue = (
  load: number, // weight * reps
  rpe: number,
  fatigueFactor: number,
  setIndex: number // 0-based index of set in the session
): number => {
  // Safety check
  if (isNaN(load) || isNaN(rpe)) return 0;

  // Intensity Scaling: Non-linear. RPE 10 is vastly more taxing than RPE 5.
  // Using a square function to model CNS stress accumulation at high intensities.
  const intensityMultiplier = Math.pow(Math.min(rpe, 10) / 10, 2);

  // Systemic Drag: Progressive fatigue accumulation
  // Sets 1-5: Minimal extra drag
  // Sets 10+: Significant systemic tax (+3% per set after index 0)
  const systemicDrag = 1 + (setIndex * 0.03);

  const result = load * intensityMultiplier * fatigueFactor * systemicDrag;
  return isFinite(result) ? result : 0;
};

/**
 * Inventory-Aware Plate Solver
 * Solves the change-making problem with finite resources.
 */
export const solvePlateLoading = (
  targetWeight: number,
  barWeight: number,
  inventory: PlateInventory
): { plates: number[], remainingDelta: number } => {
  const neededPerSide = (targetWeight - barWeight) / 2;

  if (neededPerSide <= 0) return { plates: [], remainingDelta: 0 };

  // Sort available plates descending
  const availablePlates = Object.keys(inventory)
    .map(Number)
    .sort((a, b) => b - a);

  const result: number[] = [];
  let currentWeight = 0;

  // Working copy of inventory
  const currentInventory = { ...inventory };

  // SAFETY: Max iteration count to prevent infinite loop/freeze if inputs are corrupted
  let safetyCounter = 0;
  const MAX_ITERATIONS = 100;

  // Greedy approach with inventory check
  for (const plate of availablePlates) {
    // While this plate fits...
    while (currentWeight + plate <= neededPerSide + 0.1) { // 0.1 float tolerance

      safetyCounter++;
      if (safetyCounter > MAX_ITERATIONS) {
        console.warn("[PlateCalc] Infinite loop detected, aborting calc.");
        break;
      }

      // Check if we have 2 plates (one for each side)
      if ((currentInventory[plate] || 0) >= 2) {
        result.push(plate);
        currentWeight += plate;
        currentInventory[plate] -= 2;
      } else {
        break; // Out of this plate, try next smaller
      }
    }
  }

  const delta = neededPerSide - currentWeight;
  return { plates: result, remainingDelta: delta };
};
