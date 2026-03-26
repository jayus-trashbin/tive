import { Session, WorkoutSet, MuscleGroup, Exercise } from '../types/domain';

export interface TimeSeriesPoint {
    date: number;
    value: number;
    label?: string;
}

export interface HeatmapPoint {
    date: string; // YYYY-MM-DD
    count: number;
}

export interface MuscleVolumePoint {
    muscle: MuscleGroup;
    volume: number;
    percentage: number;
}

export interface PREvent {
    date: number;
    exerciseName: string;
    weight: number;
    reps: number;
    estimated1RM: number;
}

/**
 * Get total training volume by day for the last N days
 */
export function getVolumeTimeSeries(
    sessions: Session[],
    days: number = 30
): TimeSeriesPoint[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const validSessions = sessions.filter(s => s.date >= cutoff && !s.deletedAt && s.isCompleted);

    // Group by day
    const dailyVolume = new Map<string, number>();

    validSessions.forEach(session => {
        const dayKey = new Date(session.date).toISOString().split('T')[0];
        const currentVolume = dailyVolume.get(dayKey) || 0;
        dailyVolume.set(dayKey, currentVolume + session.volumeLoad);
    });

    // Fill in missing days with 0
    const result: TimeSeriesPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        result.push({
            date: d.getTime(),
            value: dailyVolume.get(dayKey) || 0,
            label: dayKey
        });
    }

    return result;
}

/**
 * Get 1RM progression for a specific exercise
 */
export function get1RMProgression(
    sessions: Session[],
    exerciseId: string
): TimeSeriesPoint[] {
    const result: TimeSeriesPoint[] = [];

    // Sort sessions by date (oldest first)
    const sortedSessions = [...sessions]
        .filter(s => !s.deletedAt && s.isCompleted)
        .sort((a, b) => a.date - b.date);

    sortedSessions.forEach(session => {
        const exerciseSets = session.sets.filter(s => s.exerciseId === exerciseId);

        if (exerciseSets.length > 0) {
            // Get the best 1RM from this session for this exercise
            const best1RM = Math.max(...exerciseSets.map(s => s.estimated1RM || 0));

            if (best1RM > 0) {
                result.push({
                    date: session.date,
                    value: best1RM,
                    label: new Date(session.date).toLocaleDateString()
                });
            }
        }
    });

    return result;
}

/**
 * Get training frequency heatmap for the last 90 days
 */
export function getFrequencyHeatmap(sessions: Session[]): HeatmapPoint[] {
    const days = 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const validSessions = sessions.filter(s => s.date >= cutoff && !s.deletedAt && s.isCompleted);

    const dailyCount = new Map<string, number>();

    validSessions.forEach(session => {
        const dayKey = new Date(session.date).toISOString().split('T')[0];
        const current = dailyCount.get(dayKey) || 0;
        dailyCount.set(dayKey, current + 1);
    });

    const result: HeatmapPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        result.push({
            date: dayKey,
            count: dailyCount.get(dayKey) || 0
        });
    }

    return result;
}

/**
 * Get volume distribution by muscle group
 */
export function getMuscleVolumeDistribution(
    sessions: Session[],
    exercises: Exercise[],
    days: number = 30
): MuscleVolumePoint[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const validSessions = sessions.filter(s => s.date >= cutoff && !s.deletedAt && s.isCompleted);

    const exerciseMap = new Map(exercises.map(e => [e.id, e]));
    const muscleVolume = new Map<MuscleGroup, number>();
    let totalVolume = 0;

    validSessions.forEach(session => {
        session.sets.forEach(set => {
            const exercise = exerciseMap.get(set.exerciseId);
            if (exercise) {
                const setVolume = set.weight * set.reps;
                const current = muscleVolume.get(exercise.targetMuscle) || 0;
                muscleVolume.set(exercise.targetMuscle, current + setVolume);
                totalVolume += setVolume;
            }
        });
    });

    const muscles: MuscleGroup[] = ['chest', 'back', 'upper legs', 'lower legs', 'shoulders', 'arms'];

    return muscles.map(muscle => ({
        muscle,
        volume: muscleVolume.get(muscle) || 0,
        percentage: totalVolume > 0
            ? Math.round((muscleVolume.get(muscle) || 0) / totalVolume * 100)
            : 0
    }));
}

/**
 * Get recent personal records
 */
export function getRecentPRs(
    sessions: Session[],
    exercises: Exercise[],
    limit: number = 10
): PREvent[] {
    const exerciseMap = new Map(exercises.map(e => [e.id, e]));
    const allPRs: PREvent[] = [];

    sessions
        .filter(s => !s.deletedAt && s.isCompleted)
        .forEach(session => {
            session.sets.forEach(set => {
                if (set.isPR) {
                    const exercise = exerciseMap.get(set.exerciseId);
                    if (exercise) {
                        allPRs.push({
                            date: session.date,
                            exerciseName: exercise.name,
                            weight: set.weight,
                            reps: set.reps,
                            estimated1RM: set.estimated1RM
                        });
                    }
                }
            });
        });

    // Sort by date (most recent first) and limit
    return allPRs
        .sort((a, b) => b.date - a.date)
        .slice(0, limit);
}

/**
 * Calculate weekly training stats summary
 */
export function getWeeklySummary(sessions: Session[], weeks: number = 4): {
    weekStart: number;
    volume: number;
    sessions: number;
    avgPerSession: number;
}[] {
    const result = [];
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < weeks; i++) {
        const weekStart = now - (i + 1) * weekMs;
        const weekEnd = now - i * weekMs;

        const weekSessions = sessions.filter(s =>
            s.date >= weekStart &&
            s.date < weekEnd &&
            !s.deletedAt &&
            s.isCompleted
        );

        const totalVolume = weekSessions.reduce((acc, s) => acc + s.volumeLoad, 0);

        result.push({
            weekStart,
            volume: totalVolume,
            sessions: weekSessions.length,
            avgPerSession: weekSessions.length > 0 ? Math.round(totalVolume / weekSessions.length) : 0
        });
    }

    return result.reverse(); // Oldest first
}

/**
 * Format volume for display (e.g., 12500 -> "12.5k")
 */
export function formatVolume(volume: number): string {
    if (volume >= 1000000) {
        return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
        return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
}

/**
 * Get exercises sorted by most used
 */
export function getMostUsedExercises(
    sessions: Session[],
    exercises: Exercise[],
    limit: number = 10
): { exercise: Exercise; setCount: number; totalVolume: number }[] {
    const exerciseMap = new Map(exercises.map(e => [e.id, e]));
    const usage = new Map<string, { setCount: number; totalVolume: number }>();

    sessions
        .filter(s => !s.deletedAt && s.isCompleted)
        .forEach(session => {
            session.sets.forEach(set => {
                const current = usage.get(set.exerciseId) || { setCount: 0, totalVolume: 0 };
                usage.set(set.exerciseId, {
                    setCount: current.setCount + 1,
                    totalVolume: current.totalVolume + (set.weight * set.reps)
                });
            });
        });

    return Array.from(usage.entries())
        .map(([id, stats]) => ({
            exercise: exerciseMap.get(id)!,
            ...stats
        }))
        .filter(item => item.exercise) // Remove undefined exercises
        .sort((a, b) => b.setCount - a.setCount)
        .slice(0, limit);
}

/**
 * Calculate muscle intensity map for a single session
 * Used for the Smart Muscle Overlay
 */
export function getSessionMuscleIntensity(
    session: Session,
    exercises: Exercise[]
): Map<MuscleGroup, number> {
    const exerciseMap = new Map(exercises.map(e => [e.id, e]));
    const intensityMap = new Map<MuscleGroup, number>();

    session.sets.forEach(set => {
        const exercise = exerciseMap.get(set.exerciseId);
        if (exercise) {
            const rpe = set.rpe > 0 ? set.rpe : 7;
            const score = Math.min(10, rpe) / 10;
            const current = intensityMap.get(exercise.targetMuscle) || 0;
            intensityMap.set(exercise.targetMuscle, current + score);
        }
    });

    return intensityMap;
}

// --- E-03. Weekly Muscle Volume with Delta ---

export interface WeeklyMuscleVolumePoint {
    muscle: MuscleGroup;
    /** Total volume (kg × reps) this week */
    thisWeek: number;
    /** Total volume last week */
    lastWeek: number;
    /** Absolute delta */
    delta: number;
    /** Percentage change (null when lastWeek === 0) */
    deltaPct: number | null;
    /** Number of sets performed this week for this muscle */
    sets: number;
}

/**
 * E-03 — Returns per-muscle volume for this week vs. last week.
 * Useful to detect imbalances and track progressive overload per muscle group.
 */
export function getWeeklyMuscleVolume(
    sessions: Session[],
    exercises: Exercise[]
): WeeklyMuscleVolumePoint[] {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const thisWeekStart = now - weekMs;
    const lastWeekStart = now - 2 * weekMs;

    const exerciseMap = new Map(exercises.map(e => [e.id, e]));

    const validSessions = sessions.filter(s => s.isCompleted && !s.deletedAt);
    const thisWeekSessions = validSessions.filter(s => s.date >= thisWeekStart);
    const lastWeekSessions = validSessions.filter(s => s.date >= lastWeekStart && s.date < thisWeekStart);

    const muscles: MuscleGroup[] = ['chest', 'back', 'upper legs', 'lower legs', 'shoulders', 'arms', 'core', 'cardio'];

    const calcVolume = (sessionList: Session[], muscle: MuscleGroup) => {
        let vol = 0;
        let setCount = 0;
        sessionList.forEach(session => {
            session.sets.forEach(set => {
                const ex = exerciseMap.get(set.exerciseId);
                if (ex && ex.targetMuscle === muscle) {
                    vol += set.weight * set.reps;
                    setCount++;
                }
            });
        });
        return { vol, setCount };
    };

    return muscles.map(muscle => {
        const { vol: thisWeek, setCount: sets } = calcVolume(thisWeekSessions, muscle);
        const { vol: lastWeek } = calcVolume(lastWeekSessions, muscle);
        const delta = thisWeek - lastWeek;
        const deltaPct = lastWeek > 0 ? (delta / lastWeek) * 100 : null;
        return { muscle, thisWeek, lastWeek, delta, deltaPct, sets };
    });
}
