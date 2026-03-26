
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
      const lowerName = ex.name.toLowerCase();

      const isPushArm = lowerName.includes('extension') || lowerName.includes('tricep') || lowerName.includes('trícep') || lowerName.includes('push') || lowerName.includes('press');
      const isPullArm = lowerName.includes('curl') || lowerName.includes('bicep') || lowerName.includes('bícep') || lowerName.includes('rosca') || lowerName.includes('pull');

      if (ex.targetMuscle === 'chest' || ex.targetMuscle === 'shoulders' || (ex.targetMuscle === 'arms' && isPushArm)) {
        stats.push += vol;
      } else if (ex.targetMuscle === 'back' || (ex.targetMuscle === 'arms' && !isPushArm)) {
        // If it's arms and not push, we assume pull by default (biceps/forearms)
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

// --- H. Intelligent Weight Suggestion & Previous Performance ---
export const getPreviousSetPerformance = (
  history: Session[],
  routineId: string | undefined,
  exerciseId: string,
  setIndex: number
): WorkoutSet | null => {
  if (!history || history.length === 0) return null;

  // Search in reverse chronological order
  const sortedHistory = [...history].sort((a, b) => b.date - a.date);

  // First try to find in the same routine
  if (routineId) {
    for (const session of sortedHistory) {
      if (session.routineId === routineId) {
        const sets = session.sets.filter(s => s.exerciseId === exerciseId && s.isCompleted);
        if (sets.length > 0) {
          return sets[Math.min(setIndex, sets.length - 1)];
        }
      }
    }
  }

  // Fallback to any routine
  for (const session of sortedHistory) {
    const sets = session.sets.filter(s => s.exerciseId === exerciseId && s.isCompleted);
    if (sets.length > 0) {
      return sets[Math.min(setIndex, sets.length - 1)];
    }
  }

  return null;
};

export const getSuggestedWeight = (previousSet: WorkoutSet | null): number | null => {
  if (!previousSet || previousSet.weight === 0) return null;
  // Simple heuristic: if RPE < 8 previously, suggest 2.5kg more. Otherwise maintain.
  if (previousSet.rpe && previousSet.rpe < 8) {
    return previousSet.weight + 2.5;
  }
  return previousSet.weight;
};

// --- E-01. Exercise Progression Status Engine ---

export type ProgressionStatus = 'new' | 'progressing' | 'plateau' | 'stalled';

export interface ExerciseProgressStatus {
  status: ProgressionStatus;
  /** % change in e1RM from the 2 previous sessions to the 2 most recent */
  trend: number;
  /** Best e1RM seen so far for this exercise */
  bestE1RM: number;
  /** Number of sessions this exercise has been logged */
  sessionCount: number;
  message: string;
}

/**
 * Analyses historical sessions for a given exercise and returns
 * a rich progression status object used for UI feedback.
 */
export const getExerciseProgressStatus = (
  history: Session[],
  exerciseId: string
): ExerciseProgressStatus => {
  // Gather sessions that include this exercise, sorted oldest-first
  const relevantSessions = history
    .filter(s => s.isCompleted && !s.deletedAt && s.sets.some(set => set.exerciseId === exerciseId))
    .sort((a, b) => a.date - b.date);

  if (relevantSessions.length === 0) {
    return { status: 'new', trend: 0, bestE1RM: 0, sessionCount: 0, message: 'No history yet. Log your first set!' };
  }

  // --- Compute best e1RM per session ---
  const sessionBests = relevantSessions.map(session => {
    const sets = session.sets.filter(s => s.exerciseId === exerciseId && s.isCompleted && s.estimated1RM > 0);
    return sets.length > 0 ? Math.max(...sets.map(s => s.estimated1RM)) : 0;
  }).filter(v => v > 0);

  const sessionCount = sessionBests.length;
  const bestE1RM = Math.max(...sessionBests);

  if (sessionCount < 2) {
    return { status: 'new', trend: 0, bestE1RM, sessionCount, message: 'Keep going! Need a few more sessions to track trend.' };
  }

  // Compare recent 2 vs previous 2 (or all available)
  const recent = sessionBests.slice(-2);
  const previous = sessionBests.slice(-4, -2);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const prevAvg = previous.length > 0
    ? previous.reduce((a, b) => a + b, 0) / previous.length
    : sessionBests[0]; // baseline vs first session

  const trend = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;

  // --- Classify ---
  let status: ProgressionStatus;
  let message: string;

  if (trend > 2) {
    status = 'progressing';
    message = `+${trend.toFixed(1)}% e1RM — great progress, keep the momentum!`;
  } else if (trend >= -1) {
    // Plateau: no meaningful change over the last 3+ sessions
    const lastN = sessionBests.slice(-3);
    const maxDiff = lastN.length >= 3 ? Math.max(...lastN) - Math.min(...lastN) : Infinity;
    const absoluteChange = Math.abs(recentAvg - bestE1RM);
    if (lastN.length >= 3 && maxDiff < bestE1RM * 0.015) {
      status = 'plateau';
      message = `Plateau detected — e1RM flat for ${sessionCount} sessions. Time to change stimulus.`;
    } else {
      status = 'progressing';
      message = `Stable performance. Maintain or push slightly harder.`;
    }
  } else {
    status = 'stalled';
    message = `${Math.abs(trend).toFixed(1)}% drop in e1RM — consider a deload or check recovery.`;
  }

  return { status, trend, bestE1RM, sessionCount, message };
};

// --- E-02. Plateau Detection & Contextual Suggestions ---

export type PlateauSuggestionType = 'deload' | 'volume' | 'intensity' | 'variation';

export interface PlateauSuggestion {
  type: PlateauSuggestionType;
  title: string;
  description: string;
  /** Icon name hint for the UI (lucide-react) */
  icon: string;
}

/**
 * Returns actionable suggestions when a plateau or stall is detected.
 * Each suggestion maps to a type that the UI can display with an appropriate icon/color.
 */
export const getPlateauSuggestions = (
  status: ExerciseProgressStatus
): PlateauSuggestion[] => {
  if (status.status === 'new' || status.status === 'progressing') return [];

  const suggestions: PlateauSuggestion[] = [];

  if (status.status === 'plateau') {
    // After a plateau, classic strategies: vary load, volume, or try a deload week
    suggestions.push({
      type: 'intensity',
      title: 'Push Intensity',
      description: 'Try working up to your RPE 9 on your top set this session.',
      icon: 'Zap'
    });
    suggestions.push({
      type: 'volume',
      title: 'Add a Working Set',
      description: 'Add 1 extra working set at the same load for accumulated stress.',
      icon: 'Plus'
    });
    suggestions.push({
      type: 'variation',
      title: 'Switch Variation',
      description: 'Swap to a close variation for 2 weeks (e.g. close-grip, paused, Romanian).',
      icon: 'Shuffle'
    });
  }

  if (status.status === 'stalled') {
    suggestions.push({
      type: 'deload',
      title: 'Take a Deload',
      description: 'Drop to 60% of your normal weight this week. Your CNS needs recovery.',
      icon: 'Waves'
    });
    suggestions.push({
      type: 'variation',
      title: 'Change Exercise',
      description: 'Replace this exercise for 3–4 weeks to break the adaptation.',
      icon: 'RefreshCw'
    });
  }

  return suggestions;
};

// --- I. Session Completion Core (State Transformers) ---

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
  physiology: PhysiologyState,
  history: Session[] = []
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

  // Calculate ACWR including the current session
  const simulatedSession = { ...activeSession, volumeLoad: totalVolume, date: now };
  const acwrResult = calculateACWR([...history, simulatedSession]);

  // 4. TRANSFORM SESSION
  const completedSession: Session = {
    ...activeSession,
    sets: completedSets,
    isCompleted: true,
    volumeLoad: totalVolume,
    acwr: acwrResult.ratio,
    updatedAt: now,
    endTime: now,
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
