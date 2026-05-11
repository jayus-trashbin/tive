import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    calculateCurrentStreak,
    calculateACWR,
    processSessionCompletion,
    SessionCompletionResult,
    calculateWilks,
    checkAutoRegulation,
    calculateSymmetry,
    getWeeklyStats,
    estimateRoutineDuration,
    getExerciseProgressStatus
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

        it('should return optimal for empty history', () => {
            expect(calculateACWR([]).risk).toBe('optimal');
        });
    });

    describe('calculateWilks', () => {
        it('calculates for male', () => {
            expect(calculateWilks(500, 80, 'male')).toBeGreaterThan(0);
        });
        it('calculates for female', () => {
            expect(calculateWilks(300, 60, 'female')).toBeGreaterThan(0);
        });
        it('returns 0 for 0 bodyweight', () => {
            expect(calculateWilks(500, 0, 'male')).toBe(0);
        });
    });

    describe('checkAutoRegulation', () => {
        it('suggests dropping weight if RPE is overshot', () => {
            const set = { rpe: 10 } as any;
            const res = checkAutoRegulation(set, 7);
            expect(res.dropPercent).toBe(0.05);
            expect(res.suggestion).toContain("Drop weight");
        });
        it('suggests increasing weight if RPE is undershot', () => {
            const set = { rpe: 4 } as any;
            const res = checkAutoRegulation(set, 7);
            expect(res.dropPercent).toBe(-0.025);
            expect(res.suggestion).toContain("Increase load");
        });
        it('suggests nothing if on target', () => {
            const set = { rpe: 7.5 } as any;
            const res = checkAutoRegulation(set, 7);
            expect(res.suggestion).toBeNull();
        });
    });

    describe('calculateSymmetry', () => {
        it('calculates symmetry distribution correctly', () => {
            const history = [
                {
                    sets: [
                        { exerciseId: 'push1', weight: 100, reps: 10 },
                        { exerciseId: 'pull1', weight: 50, reps: 10 }
                    ]
                }
            ] as Session[];
            
            const exercises = new Map<string, any>();
            exercises.set('push1', { name: 'Bench Press', targetMuscle: 'chest' });
            exercises.set('pull1', { name: 'Pull Up', targetMuscle: 'back' });

            const result = calculateSymmetry(history, exercises);
            const push = result.find(r => r.subject === 'Push');
            const pull = result.find(r => r.subject === 'Pull');
            
            expect(push?.A).toBeCloseTo(66.67, 1);
            expect(pull?.A).toBeCloseTo(33.33, 1);
        });
    });

    describe('getWeeklyStats', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });
        afterEach(() => {
            vi.useRealTimers();
        });

        it('calculates weekly stats correctly', () => {
            // Set time to a Thursday
            const thursday = new Date(2023, 10, 16, 12, 0, 0); // Nov 16, 2023 is Thursday
            vi.setSystemTime(thursday);

            const today = thursday.getTime();
            const history = [
                { date: today, volumeLoad: 1000 },
                { date: today - 86400000, volumeLoad: 500 }
            ] as Session[];

            const result = getWeeklyStats(history);
            expect(result.count).toBe(2);
            expect(result.volume).toBe(1500);
        });
    });

    describe('estimateRoutineDuration', () => {
        it('estimates duration correctly for basic routine', () => {
            const routine = {
                blocks: [
                    {
                        restSeconds: 60,
                        sets: [{ targetReps: '10' }, { targetReps: '10' }]
                    }
                ]
            } as any;
            // setup: 45s, sets: 2 * 10 * 4 = 80s, rest: 60s
            // total = 185s -> ~3 mins
            expect(estimateRoutineDuration(routine)).toBe(3);
        });
    });

    describe('getExerciseProgressStatus', () => {
        it('returns new for empty history', () => {
            const res = getExerciseProgressStatus([], 'ex1');
            expect(res.status).toBe('new');
        });

        it('detects progressing trend', () => {
            const history = [
                { date: 1000, isCompleted: true, sets: [{ exerciseId: 'ex1', isCompleted: true, estimated1RM: 100 }] },
                { date: 2000, isCompleted: true, sets: [{ exerciseId: 'ex1', isCompleted: true, estimated1RM: 100 }] },
                { date: 3000, isCompleted: true, sets: [{ exerciseId: 'ex1', isCompleted: true, estimated1RM: 105 }] },
                { date: 4000, isCompleted: true, sets: [{ exerciseId: 'ex1', isCompleted: true, estimated1RM: 110 }] }
            ] as any[];
            const res = getExerciseProgressStatus(history, 'ex1');
            expect(res.status).toBe('progressing');
            expect(res.trend).toBeGreaterThan(0);
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
