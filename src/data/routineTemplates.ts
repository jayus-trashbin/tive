import { Routine, SetType } from '../types/domain';

const createSet = (reps: string): any => ({
  id: crypto.randomUUID(),
  type: 'working' as SetType,
  targetReps: reps,
  targetRpe: 8
});

const createBlock = (exerciseId: string, setsCount: number, reps: string) => ({
  id: crypto.randomUUID(),
  exerciseId,
  isSuperset: false,
  sets: Array.from({ length: setsCount }, () => createSet(reps)),
});

export const routineTemplates: Routine[] = [
  {
    id: 'template_fullbody_a',
    name: 'Full Body A',
    exerciseIds: ['fb_1', 'fb_2', 'fb_6', 'fb_10'],
    blocks: [
      createBlock('fb_1', 3, '5-8'), // Squat
      createBlock('fb_2', 3, '5-8'), // Bench Press
      createBlock('fb_6', 3, '8-12'), // DB Row
      createBlock('fb_10', 2, '12-15'), // Lateral Raise
    ],
  },
  {
    id: 'template_fullbody_b',
    name: 'Full Body B',
    exerciseIds: ['fb_3', 'fb_4', 'fb_5', 'fb_8'],
    blocks: [
      createBlock('fb_3', 3, '5'), // Deadlift
      createBlock('fb_4', 3, '5-8'), // Overhead Press
      createBlock('fb_5', 3, '8-12'), // Pull Up
      createBlock('fb_8', 3, '10-15'), // Leg Press
    ],
  },
  {
    id: 'template_upper',
    name: 'Upper Body',
    exerciseIds: ['fb_2', 'fb_6', 'fb_4', 'fb_5', 'fb_10'],
    blocks: [
      createBlock('fb_2', 3, '5-8'), // Bench Press
      createBlock('fb_6', 3, '8-12'), // DB Row
      createBlock('fb_4', 3, '8-12'), // Overhead Press
      createBlock('fb_5', 3, 'AMRAP'), // Pull Up
      createBlock('fb_10', 3, '12-15'), // Lateral Raise
    ],
  },
  {
    id: 'template_lower',
    name: 'Lower Body',
    exerciseIds: ['fb_1', 'fb_9', 'fb_8', 'fb_11'],
    blocks: [
      createBlock('fb_1', 3, '5-8'), // Squat
      createBlock('fb_9', 3, '8-12'), // RDL
      createBlock('fb_8', 3, '10-15'), // Leg Press
      createBlock('fb_11', 4, '15-20'), // Calf Raise
    ],
  },
  {
    id: 'template_ppl_push',
    name: 'Push (Chest, Shoulders, Triceps)',
    exerciseIds: ['fb_2', 'fb_4', 'fb_7', 'fb_10'],
    blocks: [
      createBlock('fb_2', 3, '5-8'), // Bench
      createBlock('fb_4', 3, '8-12'), // OHP
      createBlock('fb_7', 3, '8-12'), // Incline DB
      createBlock('fb_10', 4, '15-20'), // Lateral Raise
    ],
  },
  {
    id: 'template_ppl_pull',
    name: 'Pull (Back, Biceps)',
    exerciseIds: ['fb_3', 'fb_5', 'fb_6'],
    blocks: [
      createBlock('fb_3', 1, '5'), // Deadlift
      createBlock('fb_5', 3, 'AMRAP'), // Pull up
      createBlock('fb_6', 3, '10-12'), // Row
    ],
  }
];

type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
type Goal = 'strength' | 'hypertrophy';

/** Maps the user's onboarding profile to the best matching starting routine template. */
const PROFILE_MAP: Record<ExperienceLevel, Record<Goal, string>> = {
  beginner:     { strength: 'template_fullbody_a', hypertrophy: 'template_fullbody_b' },
  intermediate: { strength: 'template_upper',       hypertrophy: 'template_ppl_push'   },
  advanced:     { strength: 'template_upper',       hypertrophy: 'template_ppl_push'   },
};

/**
 * Returns a deep-cloned routine template best suited for the given experience level and goal.
 * Cloning ensures each returned template has fresh UUIDs (safe to save directly to the store).
 * The original template id is preserved as `_templateId` for traceability.
 */
export function getTemplateForProfile(level: ExperienceLevel, goal: Goal): Routine & { _templateId: string } {
  const templateId = PROFILE_MAP[level][goal];
  const template = routineTemplates.find(t => t.id === templateId)!;

  // Deep-clone with fresh IDs so callers can safely mutate / save to store
  return {
    ...template,
    id: crypto.randomUUID(),
    _templateId: templateId,
    blocks: template.blocks?.map(b => ({
      ...b,
      id: crypto.randomUUID(),
      sets: b.sets.map(s => ({ ...s, id: crypto.randomUUID() })),
    })),
  };
}

