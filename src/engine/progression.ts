import { Session, WorkoutSet, Exercise, MuscleGroup } from '../types';

export interface ProgressionContext {
  previousSet: WorkoutSet | null;
  recentHistory: Session[];
  exerciseId: string;
  setIndex: number;
  exercise?: Exercise;
}

const PROGRESSION_INCREMENTS: Record<MuscleGroup, number> = {
  'upper legs': 5,
  'back': 2.5,
  'chest': 2.5,
  'shoulders': 1.25,
  'arms': 1,
  'lower legs': 2.5,
  'core': 0,
  'cardio': 0
};

export const getSmartWeightSuggestion = (context: ProgressionContext): number | null => {
  const { previousSet, recentHistory, exerciseId, setIndex, exercise } = context;

  if (!previousSet || previousSet.weight === 0) return null;

  const currentWeight = previousSet.weight;
  const lastRpe = previousSet.rpe || 8;

  // Se o RPE já está no limite, manter o peso
  if (lastRpe >= 9.5) {
      return currentWeight;
  }

  // 1. Coletar últimas 6 sessões com este exercício
  const relevantSessions = recentHistory
      .filter(s => s.isCompleted && s.sets.some(set => set.exerciseId === exerciseId))
      .sort((a, b) => b.date - a.date)
      .slice(0, 6)
      .reverse(); // oldest first for trend analysis

  if (relevantSessions.length < 3) {
      // Fallback para linear simples se não houver dados suficientes
      const inc = exercise?.targetMuscle ? PROGRESSION_INCREMENTS[exercise.targetMuscle] || 2.5 : 2.5;
      return lastRpe < 8.5 ? currentWeight + inc : currentWeight;
  }

  // 2 e 3. Calcular e1RM e RPE médio por sessão
  const stats = relevantSessions.map(session => {
      const sets = session.sets.filter(s => s.exerciseId === exerciseId && s.isCompleted);
      const e1rm = sets.length > 0 ? Math.max(...sets.map(s => s.estimated1RM || 0)) : 0;
      const avgRpe = sets.reduce((acc, s) => acc + (s.rpe || 8), 0) / (sets.length || 1);
      return { e1rm, avgRpe };
  }).filter(s => s.e1rm > 0);

  if (stats.length < 3) return currentWeight;

  const firstHalf = stats.slice(0, Math.floor(stats.length / 2));
  const secondHalf = stats.slice(Math.floor(stats.length / 2));

  const avgE1rmFirst = firstHalf.reduce((acc, s) => acc + s.e1rm, 0) / firstHalf.length;
  const avgE1rmSecond = secondHalf.reduce((acc, s) => acc + s.e1rm, 0) / secondHalf.length;
  
  const avgRpeFirst = firstHalf.reduce((acc, s) => acc + s.avgRpe, 0) / firstHalf.length;
  const avgRpeSecond = secondHalf.reduce((acc, s) => acc + s.avgRpe, 0) / secondHalf.length;

  const e1rmTrend = avgE1rmSecond - avgE1rmFirst;
  const rpeTrend = avgRpeSecond - avgRpeFirst;

  const increment = exercise?.targetMuscle ? PROGRESSION_INCREMENTS[exercise.targetMuscle] || 2.5 : 2.5;

  // 4. Se RPE trend subindo (+0.5 por sessão) → MANTER peso (fatigue, não fraqueza)
  if (rpeTrend >= 0.5) {
      return currentWeight;
  }

  // 7. Se e1RM caindo E RPE subindo → STALL/OVERREACH → sugerir deload -10%
  if (e1rmTrend < 0 && rpeTrend > 0) {
      // Deload arredondado
      return Math.max(0, Math.round((currentWeight * 0.9) / increment) * increment);
  }

  // 5. Se e1RM trend plano E RPE estável → PLATÔ → sugerir +microload
  if (Math.abs(e1rmTrend) < (avgE1rmFirst * 0.02) && Math.abs(rpeTrend) < 0.5) {
      return currentWeight + increment;
  }

  // 6. Se e1RM crescendo E RPE estável → PROGRESSÃO normal
  if (e1rmTrend > 0 && rpeTrend < 0.5) {
      return currentWeight + increment;
  }

  // Fallback safe
  return currentWeight;
};
