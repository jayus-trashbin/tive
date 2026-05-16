
import { MuscleGroup } from '../types';
import { logger } from './logger';

export interface PlateInventory {
  [weight: number]: number; // weight -> count
}

// --- BIOLOGICAL CONSTANTS ---

// Recovery Half-Life (Hours): Time for fatigue to drop by 50%
// Large muscles/CNS heavy lifts take longer. Small muscles recover fast.
export { MAX_MUSCLE_CAPACITY, MUSCLE_RECOVERY_PROFILE, calculateMuscleReadiness } from '../engine/fatigueModel';

/**
 * Hybrid 1RM Formula
 * Combines Brzycki (low reps), Epley (mid reps), and Wathan (high reps)
 * normalization to failure via RPE projection.
 */
export const calculateHybrid1RM = (weight: number, reps: number, rpe: number = 10): number => {
  if (weight <= 0 || reps <= 0) return 0;

  // Guard: clamp rpe to valid physiological range
  const clampedRpe = Math.min(10, Math.max(1, rpe));

  // 1. Normalize "Reps to Failure" (Effective Reps)
  // RPE 10 = 0 RIR (Reps In Reserve)
  // RPE 8 = 2 RIR
  const rir = Math.max(0, 10 - clampedRpe);

  // Guard: clamp effectiveReps to [1, 36] — Brzycki denominator (37 - 37) = 0 would be Infinity
  const effectiveReps = Math.min(36, Math.max(1, reps + rir));

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

  // Using an exponential curve for RPE severity
  const rpeMultiplier = Math.exp((rpe - 7) * 0.15);

  // Systemic Drag: Progressive fatigue accumulation
  // Sets 1-5: Minimal extra drag
  // Sets 10+: Significant systemic tax (+5% per set after index 0)
  const consecutivePenalty = 1 + (setIndex * 0.05);

  const result = (load / 10) * fatigueFactor * rpeMultiplier * consecutivePenalty;
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
        logger.warn('PlateCalc', 'Infinite loop detected, aborting calc');
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
