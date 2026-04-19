import { describe, it, expect } from 'vitest';
import { 
  calculateHybrid1RM, 
  calculateDynamicFatigue, 
  solvePlateLoading, 
  calculateMuscleReadiness, 
  MUSCLE_RECOVERY_PROFILE 
} from '../utils/formulas';

describe('formulas', () => {
    describe('calculateHybrid1RM', () => {
        it('calculates Brzycki correctly for low reps', () => {
            // weight * (36 / (37 - reps))
            // 100 * (36 / (37 - 5)) = 100 * (36 / 32) = 112.5
            expect(calculateHybrid1RM(100, 5, 10)).toBeCloseTo(112.5, 1);
        });

        it('calculates Epley correctly for mid reps', () => {
            // weight * (1 + reps / 30)
            // 100 * (1 + 10 / 30) = 133.3
            expect(calculateHybrid1RM(100, 10, 10)).toBeCloseTo(133.3, 1);
        });

        it('incorporates RIR from RPE calculation', () => {
            // 5 reps @ RPE 8 = 7 effective reps
            // Epley: 100 * (1 + 7 / 30) = 123.3
            expect(calculateHybrid1RM(100, 5, 8)).toBeCloseTo(123.3, 1);
        });

        it('returns 0 for zero inputs', () => {
            expect(calculateHybrid1RM(0, 5)).toBe(0);
            expect(calculateHybrid1RM(100, 0)).toBe(0);
        });
    });

    describe('calculateMuscleReadiness', () => {
        it('decays fatigue exactly 50% after one half-life period', () => {
            const muscle = 'chest';
            const halfLife = MUSCLE_RECOVERY_PROFILE[muscle]; // 18 hours
            const initialFatigue = 1500; // max capacity for chest
            
            // Time is in the past by exactly one half-life
            const lastUpdate = Date.now() - (halfLife * 60 * 60 * 1000);
            
            const result = calculateMuscleReadiness(initialFatigue, lastUpdate, muscle);
            
            // Expected fatigue = 750. Max is 1500. Score = 1 - (750/1500) = 0.5
            expect(result.score).toBeCloseTo(0.5, 2);
            expect(result.label).toBe('Fatigued');
        });

        it('returns prime when fully recovered', () => {
            const muscle = 'chest';
            // Very old update timestamp
            const lastUpdate = Date.now() - (1000 * 60 * 60 * 1000);
            const result = calculateMuscleReadiness(1500, lastUpdate, muscle);
            
            expect(result.score).toBe(1);
            expect(result.label).toBe('Prime');
        });
    });

    describe('solvePlateLoading', () => {
        it('calculates standard plates correctly', () => {
            const inventory = { 20: 10, 10: 10, 5: 10, 2.5: 10 };
            // Total 100, Bar 20 = 80 remaining = 40 per side. Should be 2x20 per side.
            const result = solvePlateLoading(100, 20, inventory);
            expect(result.plates).toEqual([20, 20]);
            expect(result.remainingDelta).toBe(0);
        });

        it('handles limited inventory properly', () => {
            // We only have one pair of 20s
            const inventory = { 20: 2, 10: 4, 5: 10 };
            // Total 100, Bar 20 = 80 remaining = 40 per side. 
            // We can't use two 20s per side! We can only use one 20 per side.
            // 40 per side = 20 + 10 + 10
            const result = solvePlateLoading(100, 20, inventory);
            expect(result.plates).toEqual([20, 10, 10]);
        });

        it('calculates remaining delta if target weight cannot be achieved', () => {
            const inventory = { 20: 2 }; // Just one pair of 20s
            const result = solvePlateLoading(100, 20, inventory); // Needs 40 per side, has 20
            expect(result.plates).toEqual([20]);
            expect(result.remainingDelta).toBe(20);
        });
    });

    describe('calculateDynamicFatigue', () => {
        it('includes systemic drag per set', () => {
            const baseFatigue = calculateDynamicFatigue(100, 8, 1, 0); // set 0
            const highFatigue = calculateDynamicFatigue(100, 8, 1, 10); // set 10
            expect(highFatigue).toBeGreaterThan(baseFatigue);
        });

        it('exponentially scales with high RPE', () => {
            const load = 100;
            const rpe9 = calculateDynamicFatigue(load, 9, 1, 0);
            const rpe10 = calculateDynamicFatigue(load, 10, 1, 0);
            
            // e^(3*0.15) / e^(2*0.15) should be noticeable growth
            expect(rpe10).toBeGreaterThan(rpe9);
        });
    });
});
