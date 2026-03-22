
import { Session, UserStats, WorkoutSet, Routine, RoutineBlock, Exercise, PhysiologyState, MuscleGroup } from '../types';
import { MUSCLE_RECOVERY_PROFILE, calculateDynamicFatigue } from './formulas';

// --- A. Injury Prevention (ACWR) ---
// Acute: Last 7 days load / 7
// Chronic: Last 28 days load / 28
export const calculateACWR = (history: Session[]): { acute: number, chronic: number, ratio: number, risk: 'low' | 'optimal' | 'high' } => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const getAverageLoad = (days: number) => {
    const cutoff = now - (days * day);
    const relevantSessions = history.filter(s => s.date >= cutoff);
    const totalLoad = relevantSessions.reduce((acc, s) => acc + (s.volumeLoad || 0), 0);
    return totalLoad / days; // Daily average load
  };

  const acute = getAverageLoad(7);
  const chronic = getAverageLoad(28);

  // Prevent division by zero
  const ratio = (chronic === 0 || isNaN(acute) || isNaN(chronic)) ? 0 : acute / chronic;

  let risk: 'low' | 'optimal' | 'high' = 'optimal';
  if (ratio > 1.5) risk = 'high';
  if (ratio < 0.8) risk = 'low';

  return { acute, chronic, ratio, risk };
};

// --- B. Competitive Metrics (Wilks Score) ---
// Standard coefficients (Old Wilks, often used in PL)
export const calculateWilks = (weightLifted: number, bodyWeight: number, gender: 'male' | 'female'): number => {
  if (bodyWeight === 0) return 0;

  const a = gender === 'male' ? -216.0475144 : 594.31747775582;
  const b = gender === 'male' ? 16.2606339 : -27.23842536447;
  const c = gender === 'male' ? -0.002388645 : 0.82112226871;
  const d = gender === 'male' ? -0.00113732 : -0.00930733913;
  const e = gender === 'male' ? 7.01863E-06 : 4.731582E-05;
  const f = gender === 'male' ? -1.291E-08 : -9.054E-08;

  const x = bodyWeight;
  const denominator = a + b * x + c * Math.pow(x, 2) + d * Math.pow(x, 3) + e * Math.pow(x, 4) + f * Math.pow(x, 5);
  const coeff = denominator === 0 ? 0 : 500 / denominator;

  return weightLifted * coeff;
};

// --- C. Auto-Regulation (Intra-Workout AI) ---
export const checkAutoRegulation = (set: WorkoutSet, targetRpe: number = 7): { suggestion: string | null, dropPercent: number } => {
  const rpeDiff = set.rpe - targetRpe;

  // Scenario: User overshot RPE significantly
  if (rpeDiff >= 2) {
    return {
      suggestion: "High fatigue detected. Drop weight by 5-10% to maintain volume without failure.",
      dropPercent: 0.05
    };
  }

  // Scenario: User undershot (Sandbagging)
  if (rpeDiff <= -2) {
    return {
      suggestion: "Moving too fast. Increase load by 2-5% or slow down tempo.",
      dropPercent: -0.025
    };
  }

  return { suggestion: null, dropPercent: 0 };
};

// --- D. Symmetry Analysis ---
export const calculateSymmetry = (history: Session[], exercises: Map<string, any>) => {
  const stats = {
    push: 0,
    pull: 0,
    legs: 0,
    core: 0
  };

  history.forEach(session => {
    session.sets.forEach(set => {
      const ex = exercises.get(set.exerciseId);
      if (!ex) return;

      const vol = set.weight * set.reps;

      if (ex.targetMuscle === 'chest' || ex.targetMuscle === 'shoulders' || (ex.targetMuscle === 'arms' && ex.name.includes('Extension'))) {
        stats.push += vol;
      } else if (ex.targetMuscle === 'back' || (ex.targetMuscle === 'arms' && ex.name.includes('Curl'))) {
        stats.pull += vol;
      } else if (ex.targetMuscle === 'upper legs' || ex.targetMuscle === 'lower legs') {
        stats.legs += vol;
      } else if (ex.targetMuscle === 'core') {
        stats.core += vol;
      }
    });
  });

  // Normalize
  const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1;
  return [
    { subject: 'Push', A: (stats.push / total) * 100, fullMark: 100 },
    { subject: 'Pull', A: (stats.pull / total) * 100, fullMark: 100 },
    { subject: 'Legs', A: (stats.legs / total) * 100, fullMark: 100 },
    { subject: 'Core', A: (stats.core / total) * 100, fullMark: 100 },
  ];
};

// --- E. Streak Calculation ---
export const calculateCurrentStreak = (history: Session[]): number => {
  if (history.length === 0) return 0;

  // Sort by date descending
  const sortedSessions = [...history].sort((a, b) => b.date - a.date);

  // Get unique dates (normalized to midnight)
  const uniqueDates = new Set(
    sortedSessions.map(s => new Date(s.date).setHours(0, 0, 0, 0))
  );

  const datesArr = Array.from(uniqueDates).sort((a, b) => b - a);

  const today = new Date().setHours(0, 0, 0, 0);
  const yesterday = today - 86400000;

  // Check if user trained today or yesterday to keep streak alive
  if (datesArr.length === 0 || (datesArr[0] !== today && datesArr[0] !== yesterday)) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < datesArr.length - 1; i++) {
    const current = datesArr[i];
    const next = datesArr[i + 1];

    // Difference in days
    const diff = (current - next) / 86400000;

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

// --- F. Weekly Stats ---
export const getWeeklyStats = (history: Session[]) => {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0, 0, 0, 0);

  const thisWeekSessions = history.filter(s => s.date >= startOfWeek);

  return {
    count: thisWeekSessions.length,
    volume: thisWeekSessions.reduce((acc, s) => acc + s.volumeLoad, 0)
  };
};

// --- G. Routine Duration Estimation (Smart Quantifier) ---
export const estimateRoutineDuration = (routine: Routine): number => {
  // Legacy Fallback
  if (!routine.blocks || routine.blocks.length === 0) {
    return Math.round(routine.exerciseIds.length * 4.5); // ~4.5 mins per exercise (set + rest + setup)
  }

  let totalSeconds = 0;

  // Constants
  const REP_DURATION = 4; // seconds (Time Under Tension avg)
  const SETUP_BUFFER = 45; // seconds (Loading plates, getting to machine)
  const SUPERSET_SWITCH = 15; // seconds (Fast transition)

  // Helper to parse "8-12" or "AMRAP"
  const parseReps = (val: string): number => {
    if (!val) return 10;
    const str = String(val).toLowerCase();
    if (str.includes('amrap') || str.includes('fail')) return 15; // Assume longer duration
    if (str.includes('-')) {
      const parts = str.split('-').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return (parts[0] + parts[1]) / 2;
      }
    }
    const num = parseInt(str);
    return isNaN(num) ? 10 : num;
  };

  routine.blocks.forEach((block, index) => {
    const nextBlock = routine.blocks ? routine.blocks[index + 1] : undefined;

    // 1. Setup Time (Once per block)
    totalSeconds += SETUP_BUFFER;

    // 2. Sets Calculation
    const restPerSet = block.restSeconds || 90;

    block.sets.forEach((set, setIdx) => {
      const isLastSet = setIdx === block.sets.length - 1;

      // Execution Time
      const reps = parseReps(set.targetReps);
      totalSeconds += (reps * REP_DURATION);

      // Rest Time
      // Only add intra-set rest if it's NOT the last set of the block
      if (!isLastSet) {
        totalSeconds += restPerSet;
      }
    });

    // 3. Transition Time (After Block)
    const isLastBlock = index === (routine.blocks?.length || 0) - 1;

    if (!isLastBlock) {
      // Check if NEXT block is a superset linked to THIS one
      // Note: In this data model, 'isSuperset' on a block means it attaches to the PREVIOUS one.
      // So we check if the NEXT block has isSuperset = true.
      if (nextBlock && nextBlock.isSuperset) {
        totalSeconds += SUPERSET_SWITCH;
      } else {
        totalSeconds += (block.transitionSeconds || 180);
      }
    }
  });

  return Math.round(totalSeconds / 60);
};

// --- H. Session Completion Core (State Transformers) ---

export interface SessionCompletionResult {
  completedSession: Session;
  updatedExercises: Exercise[];
  updatedPhysiology: PhysiologyState;
}

/**
 * Pure transformer to handle the end of a workout session.
 * Decouples logic from Zustand state updates for testability.
 */
export const processSessionCompletion = (
  activeSession: Session,
  exercises: Exercise[],
  physiology: PhysiologyState
): SessionCompletionResult => {
  const now = Date.now();
  const completedSets = activeSession.sets.filter(s => s.isCompleted);
  const totalVolume = completedSets.reduce((acc, s) => acc + (s.weight * s.reps), 0);

  // 1. BIOLOGICAL DECAY
  const hoursPassed = (now - physiology.lastUpdate) / (1000 * 60 * 60);
  const decayedFatigue = { ...physiology.muscleFatigue };

  (Object.keys(decayedFatigue) as MuscleGroup[]).forEach(muscle => {
    const specificHalfLife = MUSCLE_RECOVERY_PROFILE[muscle] || 18;
    const validHours = isNaN(hoursPassed) ? 0 : hoursPassed;
    decayedFatigue[muscle] *= Math.pow(0.5, validHours / specificHalfLife);
  });

  // 2. ACCUMULATE NEW FATIGUE
  completedSets.forEach((workoutSet, index) => {
    const ex = exercises.find(e => e.id === workoutSet.exerciseId);
    if (ex) {
      const load = workoutSet.weight * workoutSet.reps;
      const setStress = calculateDynamicFatigue(load, workoutSet.rpe || 8, ex.fatigueFactor || 1, index);

      if (decayedFatigue[ex.targetMuscle] !== undefined && !isNaN(setStress)) {
        decayedFatigue[ex.targetMuscle] += setStress;
      }
    }
  });

  // 3. UPDATE PERSONAL RECORDS
  const updatedExercises = [...exercises];
  completedSets.forEach(set => {
    if (!set.isPR) return;
    const idx = updatedExercises.findIndex(e => e.id === set.exerciseId);
    if (idx !== -1) {
      updatedExercises[idx] = {
        ...updatedExercises[idx],
        personalRecord: set.estimated1RM,
        lastPerformed: now,
        updatedAt: now
      };
    }
  });

  // 4. TRANSFORM SESSION
  const completedSession: Session = {
    ...activeSession,
    sets: completedSets,
    isCompleted: true,
    volumeLoad: totalVolume,
    updatedAt: now,
    _synced: false
  };

  return {
    completedSession,
    updatedExercises,
    updatedPhysiology: {
      muscleFatigue: decayedFatigue,
      lastUpdate: now
    }
  };
};
