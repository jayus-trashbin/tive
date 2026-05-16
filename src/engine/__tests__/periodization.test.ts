import { describe, it, expect } from 'vitest';
import { detectCurrentPhase, getRecommendedWeeklyVolume } from '../periodization';
import { Mesocycle } from '../../types';

describe('periodization engine', () => {
    describe('detectCurrentPhase', () => {
        it('returns accumulation if no mesocycle is provided', () => {
            expect(detectCurrentPhase(null as any)).toBe('accumulation');
        });

        it('detects accumulation phase (weeks 1-2 of a 4 week block)', () => {
            const meso: Mesocycle = {
                id: '1',
                name: 'Hypertrophy Block 1',
                weeks: 4,
                focus: 'hypertrophy',
                currentWeek: 1
            };
            expect(detectCurrentPhase(meso)).toBe('accumulation');
            
            meso.currentWeek = 2;
            expect(detectCurrentPhase(meso)).toBe('accumulation');
        });

        it('detects intensification phase (second to last week)', () => {
            const meso: Mesocycle = {
                id: '1',
                name: 'Hypertrophy Block 1',
                weeks: 4,
                focus: 'hypertrophy',
                currentWeek: 3
            };
            expect(detectCurrentPhase(meso)).toBe('intensification');
        });

        it('detects deload phase (last week or beyond)', () => {
            const meso: Mesocycle = {
                id: '1',
                name: 'Hypertrophy Block 1',
                weeks: 4,
                focus: 'hypertrophy',
                currentWeek: 4
            };
            expect(detectCurrentPhase(meso)).toBe('deload');
            
            meso.currentWeek = 5;
            expect(detectCurrentPhase(meso)).toBe('deload');
        });
    });

    describe('getRecommendedWeeklyVolume', () => {
        it('suggests baseline volume for week 1', () => {
            expect(getRecommendedWeeklyVolume('chest', 1, 4, 10)).toEqual({ sets: 10, intensity: 'moderate' });
        });

        it('adds volume progressively for subsequent weeks', () => {
            expect(getRecommendedWeeklyVolume('chest', 2, 4, 10)).toEqual({ sets: 11, intensity: 'moderate' });
            expect(getRecommendedWeeklyVolume('chest', 3, 4, 10)).toEqual({ sets: 12, intensity: 'heavy' });
        });

        it('cuts volume in half for deload', () => {
            expect(getRecommendedWeeklyVolume('chest', 4, 4, 10)).toEqual({ sets: 5, intensity: 'light' });
            expect(getRecommendedWeeklyVolume('chest', 5, 4, 10)).toEqual({ sets: 5, intensity: 'light' });
        });
    });
});
