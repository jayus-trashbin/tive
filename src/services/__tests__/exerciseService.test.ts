import { describe, it, expect } from 'vitest';
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
    // OSS API uses lowercase bodyPart names: 'upper arms', 'lower arms', 'upper legs', etc.

    it('returns empty string for "all"', () => {
        expect(getApiBodyParts('all')).toBe('');
        expect(getApiBodyParts('')).toBe('');
    });

    it('expands arms to OSS upper arms and lower arms', () => {
        const result = getApiBodyParts('arms');
        expect(result).toContain('upper arms');
        expect(result).toContain('lower arms');
    });

    it('expands upper legs to OSS upper legs bodyPart', () => {
        expect(getApiBodyParts('upper legs')).toBe('upper legs');
    });

    it('maps core to OSS waist bodyPart', () => {
        expect(getApiBodyParts('core')).toBe('waist');
    });

    it('maps back to OSS back bodyPart', () => {
        expect(getApiBodyParts('back')).toBe('back');
    });

    it('passes through valid OSS bodyPart values as lowercase', () => {
        expect(getApiBodyParts('chest')).toBe('chest');
        expect(getApiBodyParts('shoulders')).toBe('shoulders');
    });
});
