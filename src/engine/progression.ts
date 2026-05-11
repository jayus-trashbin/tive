import { Session, WorkoutSet, Exercise } from '../types';

export interface ProgressionContext {
  previousSet: WorkoutSet | null;
  recentHistory: Session[];
  exerciseId: string;
  setIndex: number;
}

export const getSmartWeightSuggestion = (context: ProgressionContext): number | null => {
  const { previousSet, recentHistory, exerciseId, setIndex } = context;

  if (!previousSet || previousSet.weight === 0) return null;

  const currentWeight = previousSet.weight;
  const lastRpe = previousSet.rpe || 8;

  // 1. If RPE is very high (>9), do NOT increase weight, maybe even drop if plateauing
  if (lastRpe >= 9.5) {
      return currentWeight;
  }

  // 2. If RPE is moderately high (8.5 - 9), maintain
  if (lastRpe >= 8.5) {
      return currentWeight;
  }

  // 3. If RPE is low (< 8), we can progress
  // Analyze last 4 sessions for e1RM trend to detect plateaus
  const relevantSessions = recentHistory
      .filter(s => s.isCompleted && s.sets.some(set => set.exerciseId === exerciseId))
      .sort((a, b) => b.date - a.date)
      .slice(0, 4);

  let trendIsFlat = false;
  if (relevantSessions.length >= 3) {
      const e1rms = relevantSessions.map(session => {
          const sets = session.sets.filter(s => s.exerciseId === exerciseId && s.isCompleted);
          return sets.length > 0 ? Math.max(...sets.map(s => s.estimated1RM)) : 0;
      });
      
      const maxDiff = Math.max(...e1rms) - Math.min(...e1rms);
      // If max difference across last sessions is < 2%, we are plateauing
      if (e1rms[0] > 0 && maxDiff / e1rms[0] < 0.02) {
          trendIsFlat = true;
      }
  }

  // Microloading rules
  let increment = 2.5; // Standard 2.5kg jump
  
  // Upper body exercises often need smaller jumps (e.g. 1kg or 1.25kg) if we are stalling
  // but we don't have targetMuscle strictly in context without exercise lookup. 
  // We'll stick to 2.5kg standard unless plateauing.

  if (trendIsFlat) {
      // If plateauing, suggest volume instead of weight if possible, 
      // but if we must suggest weight, keep it the same to avoid failed reps
      return currentWeight;
  }

  // Safe progression
  return currentWeight + increment;
};
