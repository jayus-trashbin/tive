import { describe, it, expect, vi } from 'vitest';
import {
    calculateCurrentStreak,
    calculateACWR,
    processSessionCompletion,
    SessionCompletionResult
} from '../engine';
import { Session, Exercise, PhysiologyState, MuscleGroup } from '../../types';

describe('engine.ts utilities', () => {

    describe('calculateCurrentStreak', () => {
        it('should return 0 for empty history', () => {
            expect(calculateCurrentStreak([])).toBe(0);
        });

        it('should calculate streak correctly for consecutive days', () => {
            const today = new Date().setHours(0, 0, 0, 0);
            const yesterday = today - 86400000;
            const dayBefore = yesterday - 86400000;

            const history = [
                { date: today } as Session,
                { date: yesterday } as Session,
                { date: dayBefore } as Session
            ];

            expect(calculateCurrentStreak(history)).toBe(3);
        });

        it('should break streak if a day is missed', () => {
            const today = new Date().setHours(0, 0, 0, 0);
            const dayBeforeYesterday = today - (2 * 86400000);

            const history = [
                { date: today } as Session,
                { date: dayBeforeYesterday } as Session
            ];

            expect(calculateCurrentStreak(history)).toBe(1);
        });
    });

    describe('calculateACWR', () => {
        it('should calculate risk correctly', () => {
            const history: Session[] = [
                { date: Date.now(), volumeLoad: 1000 } as Session
            ];
            const result = calculateACWR(history);
            expect(result.risk).toBeDefined();
        });
    });

    describe('processSessionCompletion', () => {
        const mockActiveSession: Session = {
            id: 's1',
            date: Date.now(),
            name: 'Test Session',
            sets: [
                {
                    id: 'set1',
                    exerciseId: 'ex1',
                    weight: 100,
                    reps: 10,
                    rpe: 8,
                    isCompleted: true,
                    isPR: true,
                    estimated1RM: 110,
                    timestamp: Date.now(),
                    type: 'working'
                }
            ],
            isCompleted: false,
            volumeLoad: 0,
            updatedAt: Date.now()
        };

        const mockExercises: Exercise[] = [
            {
                id: 'ex1',
                name: 'Bench Press',
                targetMuscle: 'chest',
                fatigueFactor: 1,
                personalRecord: 100,
                updatedAt: 0,
                isUnilateral: false,
                gifUrl: '',
                instructions: [],
            }
        ];

        const mockPhysiology: PhysiologyState = {
            muscleFatigue: {
                chest: 0, back: 0, 'upper legs': 0, 'lower legs': 0, shoulders: 0, arms: 0, core: 0, cardio: 0
            },
            lastUpdate: Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
        };

        it('should transform session to completed state', () => {
            const result = processSessionCompletion(mockActiveSession, mockExercises, mockPhysiology);
            expect(result.completedSession.isCompleted).toBe(true);
            expect(result.completedSession.volumeLoad).toBe(1000);
        });

        it('should update PRs on exercises', () => {
            const result = processSessionCompletion(mockActiveSession, mockExercises, mockPhysiology);
            const bench = result.updatedExercises.find(e => e.id === 'ex1');
            expect(bench?.personalRecord).toBe(110);
        });

        it('should calculate muscle fatigue with decay', () => {
            const result = processSessionCompletion(mockActiveSession, mockExercises, mockPhysiology);
            expect(result.updatedPhysiology.muscleFatigue.chest).toBeGreaterThan(0);
        });
    });
});
