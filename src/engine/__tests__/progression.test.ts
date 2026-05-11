import { describe, it, expect } from 'vitest';
import { getSmartWeightSuggestion, ProgressionContext } from '../progression';
import { Session, WorkoutSet } from '../../types';

describe('progression engine', () => {
    describe('getSmartWeightSuggestion', () => {
        const createSession = (id: string, dateOffset: number, e1rm: number): Session => ({
            id,
            name: 'Push Day',
            date: Date.now() - dateOffset,
            isCompleted: true,
            sets: [
                {
                    id: `set-${id}`,
                    exerciseId: 'ex1',
                    weight: 100,
                    reps: 10,
                    rpe: 8,
                    isCompleted: true,
                    estimated1RM: e1rm,
                    isPR: false,
                    timestamp: Date.now()
                }
            ],
            volumeLoad: 0,
            updatedAt: Date.now()
        });

        it('returns null if no previous set', () => {
            const context: ProgressionContext = {
                previousSet: null,
                recentHistory: [],
                exerciseId: 'ex1',
                setIndex: 0
            };
            expect(getSmartWeightSuggestion(context)).toBeNull();
        });

        it('returns null if previous weight is 0', () => {
            const context: ProgressionContext = {
                previousSet: { id: '1', exerciseId: 'ex1', weight: 0, reps: 10, rpe: 8, type: 'working', isCompleted: true, estimated1RM: 0, isPR: false, timestamp: 0 },
                recentHistory: [],
                exerciseId: 'ex1',
                setIndex: 0
            };
            expect(getSmartWeightSuggestion(context)).toBeNull();
        });

        it('does not increase weight if RPE is >= 9.5', () => {
            const context: ProgressionContext = {
                previousSet: { id: '1', exerciseId: 'ex1', weight: 100, reps: 5, rpe: 9.5, type: 'working', isCompleted: true, estimated1RM: 110, isPR: false, timestamp: 0 },
                recentHistory: [],
                exerciseId: 'ex1',
                setIndex: 0
            };
            expect(getSmartWeightSuggestion(context)).toBe(100);
        });

        it('maintains weight if RPE is >= 8.5', () => {
            const context: ProgressionContext = {
                previousSet: { id: '1', exerciseId: 'ex1', weight: 100, reps: 5, rpe: 8.5, type: 'working', isCompleted: true, estimated1RM: 110, isPR: false, timestamp: 0 },
                recentHistory: [],
                exerciseId: 'ex1',
                setIndex: 0
            };
            expect(getSmartWeightSuggestion(context)).toBe(100);
        });

        it('increases weight by 2.5kg if RPE is low (< 8.5) and no plateau', () => {
            const context: ProgressionContext = {
                previousSet: { id: '1', exerciseId: 'ex1', weight: 100, reps: 5, rpe: 7, type: 'working', isCompleted: true, estimated1RM: 110, isPR: false, timestamp: 0 },
                recentHistory: [
                    createSession('s1', 1000, 110),
                    createSession('s2', 2000, 105), // Good progression trend
                    createSession('s3', 3000, 100)
                ],
                exerciseId: 'ex1',
                setIndex: 0
            };
            expect(getSmartWeightSuggestion(context)).toBe(102.5);
        });

        it('detects plateau and maintains weight if max diff in e1RM < 2%', () => {
            // e1rms: 110, 109, 110. Max diff is 1. 1/110 = ~0.9%. < 2%.
            const context: ProgressionContext = {
                previousSet: { id: '1', exerciseId: 'ex1', weight: 100, reps: 5, rpe: 7, type: 'working', isCompleted: true, estimated1RM: 110, isPR: false, timestamp: 0 },
                recentHistory: [
                    createSession('s1', 1000, 110),
                    createSession('s2', 2000, 109),
                    createSession('s3', 3000, 110)
                ],
                exerciseId: 'ex1',
                setIndex: 0
            };
            expect(getSmartWeightSuggestion(context)).toBe(100);
        });
    });
});
