import { describe, it, expect, vi } from 'vitest';
import { mapBodyPartToMuscle, getApiBodyParts } from '../exerciseService';

// mapApiToModel is not directly exported so we test via the mapping helpers
// which are the core pure logic used inside it.

describe('mapBodyPartToMuscle', () => {
    it('maps chest correctly', () => {
        expect(mapBodyPartToMuscle('CHEST')).toBe('chest');
        expect(mapBodyPartToMuscle('chest')).toBe('chest'); // case-insensitive
    });

    it('maps back and neck to back', () => {
        expect(mapBodyPartToMuscle('BACK')).toBe('back');
        expect(mapBodyPartToMuscle('NECK')).toBe('back');
    });

    it('maps arm variants to arms', () => {
        expect(mapBodyPartToMuscle('BICEPS')).toBe('arms');
        expect(mapBodyPartToMuscle('TRICEPS')).toBe('arms');
        expect(mapBodyPartToMuscle('FOREARMS')).toBe('arms');
        expect(mapBodyPartToMuscle('UPPER ARMS')).toBe('arms');
    });

    it('maps leg variants to upper legs', () => {
        expect(mapBodyPartToMuscle('QUADRICEPS')).toBe('upper legs');
        expect(mapBodyPartToMuscle('HAMSTRINGS')).toBe('upper legs');
        expect(mapBodyPartToMuscle('THIGHS')).toBe('upper legs');
        expect(mapBodyPartToMuscle('HIPS')).toBe('upper legs');
    });

    it('maps calf variants to lower legs', () => {
        expect(mapBodyPartToMuscle('CALVES')).toBe('lower legs');
        expect(mapBodyPartToMuscle('LOWER LEGS')).toBe('lower legs');
    });

    it('maps waist to core', () => {
        expect(mapBodyPartToMuscle('WAIST')).toBe('core');
    });

    it('defaults unknown strings to cardio', () => {
        expect(mapBodyPartToMuscle('UNKNOWN_BODYPART')).toBe('cardio');
        expect(mapBodyPartToMuscle('')).toBe('cardio');
        expect(mapBodyPartToMuscle('FULL BODY')).toBe('cardio');
    });
});

describe('getApiBodyParts', () => {
    it('returns empty string for "all"', () => {
        expect(getApiBodyParts('all')).toBe('');
        expect(getApiBodyParts('')).toBe('');
    });

    it('expands arms to comma-separated API values', () => {
        const result = getApiBodyParts('arms');
        expect(result).toContain('BICEPS');
        expect(result).toContain('TRICEPS');
        expect(result).toContain('FOREARMS');
    });

    it('expands upper legs to thigh/hamstring/quad/hip', () => {
        const result = getApiBodyParts('upper legs');
        expect(result).toContain('THIGHS');
        expect(result).toContain('HAMSTRINGS');
        expect(result).toContain('QUADRICEPS');
        expect(result).toContain('HIPS');
    });

    it('maps core to WAIST', () => {
        expect(getApiBodyParts('core')).toBe('WAIST');
    });

    it('maps back to BACK,NECK', () => {
        expect(getApiBodyParts('back')).toBe('BACK,NECK');
    });

    it('uppercases direct passthrough values', () => {
        expect(getApiBodyParts('chest')).toBe('CHEST');
        expect(getApiBodyParts('shoulders')).toBe('SHOULDERS');
    });
});
