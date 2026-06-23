import { describe, it, expect } from 'vitest';
import { routineTemplates, getTemplateForProfile } from '../routineTemplates';

describe('Routine Templates', () => {
  it('should have valid template data', () => {
    expect(routineTemplates.length).toBeGreaterThan(0);
    routineTemplates.forEach(template => {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.blocks).toBeDefined();
      expect(template.blocks?.length).toBeGreaterThan(0);

      template.blocks?.forEach(block => {
        expect(block.exerciseId).toBeDefined();
        expect(block.sets.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getTemplateForProfile', () => {
    it('beginner + strength → full body A', () => {
      const t = getTemplateForProfile('beginner', 'strength');
      expect(t._templateId).toBe('template_fullbody_a');
    });

    it('beginner + hypertrophy → full body B', () => {
      const t = getTemplateForProfile('beginner', 'hypertrophy');
      expect(t._templateId).toBe('template_fullbody_b');
    });

    it('intermediate + strength → upper body', () => {
      const t = getTemplateForProfile('intermediate', 'strength');
      expect(t._templateId).toBe('template_upper');
    });

    it('intermediate + hypertrophy → ppl push', () => {
      const t = getTemplateForProfile('intermediate', 'hypertrophy');
      expect(t._templateId).toBe('template_ppl_push');
    });

    it('advanced + strength → upper body', () => {
      const t = getTemplateForProfile('advanced', 'strength');
      expect(t._templateId).toBe('template_upper');
    });

    it('advanced + hypertrophy → ppl push', () => {
      const t = getTemplateForProfile('advanced', 'hypertrophy');
      expect(t._templateId).toBe('template_ppl_push');
    });

    it('result should always have blocks and exerciseIds', () => {
      const combos: Array<['beginner' | 'intermediate' | 'advanced', 'strength' | 'hypertrophy']> = [
        ['beginner', 'strength'], ['beginner', 'hypertrophy'],
        ['intermediate', 'strength'], ['intermediate', 'hypertrophy'],
        ['advanced', 'strength'], ['advanced', 'hypertrophy'],
      ];
      combos.forEach(([level, goal]) => {
        const t = getTemplateForProfile(level, goal);
        expect(t.blocks?.length).toBeGreaterThan(0);
        expect(t.exerciseIds.length).toBeGreaterThan(0);
      });
    });
  });
});
