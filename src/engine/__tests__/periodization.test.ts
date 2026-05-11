import { describe, it, expect } from 'vitest';
import { detectCurrentPhase, suggestWeeklyAdjustment } from '../periodization';
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

    describe('suggestWeeklyAdjustment', () => {
        it('suggests +1 set for accumulation', () => {
            expect(suggestWeeklyAdjustment('accumulation', 10)).toBe(11);
        });

        it('suggests keeping volume for intensification', () => {
            expect(suggestWeeklyAdjustment('intensification', 12)).toBe(12);
        });

        it('suggests cutting volume in half for deload', () => {
            expect(suggestWeeklyAdjustment('deload', 10)).toBe(5);
            expect(suggestWeeklyAdjustment('deload', 11)).toBe(5);
        });

        it('never drops volume below 1 set in deload', () => {
            expect(suggestWeeklyAdjustment('deload', 1)).toBe(1);
        });
    });
});
