
import { useCallback } from 'react';
import { MuscleGroup } from '../types';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { calculateHybrid1RM, solvePlateLoading, PlateInventory, calculateMuscleReadiness } from '../utils/formulas';

// --- Constants ---
const DEFAULT_INVENTORY: PlateInventory = {
  25: 4,
  20: 8,
  15: 4,
  10: 8,
  5: 8,
  2.5: 6,
  1.25: 4
};

export const usePhysiology = () => {
  const physiology = useWorkoutStore(state => state.physiology);

  // --- A. Estimated 1RM (Hybrid) ---
  const calculate1RM = useCallback((weight: number, reps: number, rpe: number): number => {
    return calculateHybrid1RM(weight, reps, rpe);
  }, []);

  // --- B. Readiness (Biological Decay) ---
  const calculateReadiness = useCallback((muscle: MuscleGroup) => {
    const currentFatigue = physiology.muscleFatigue[muscle] || 0;
    const lastUpdate = physiology.lastUpdate;
    
    // Use the intelligent recovery engine
    return calculateMuscleReadiness(currentFatigue, lastUpdate, muscle);
  }, [physiology]);

  // --- C. Plate Calculator (Inventory Aware) ---
  const calculatePlates = useCallback((targetWeight: number, barWeight: number = 20, inventory: PlateInventory = DEFAULT_INVENTORY) => {
    return solvePlateLoading(targetWeight, barWeight, inventory);
  }, []);

  return {
    calculate1RM,
    calculateReadiness,
    calculatePlates
  };
};
