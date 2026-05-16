import { Session, MuscleGroup, Exercise } from '../types/domain';
import { CacheManager } from './CacheManager';

export interface TimeSeriesPoint {
    date: number;
    value: number;
    label?: string;
}

export interface HeatmapPoint {
    date: string; // YYYY-MM-DD
    count: number;
    volume: number;
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

/** Helper to generate safe cache key based on history state */
const generateHistoryHash = (sessions: Session[]): string => {
    const valid = sessions.filter(s => s.isCompleted && !s.deletedAt);
    if (valid.length === 0) return 'empty';
    const lastSession = valid.reduce((latest, s) => s.date > latest.date ? s : latest, valid[0]);
    return `${valid.length}_${lastSession.date}`;
};

/**
 * Get total training volume by day for the last N days
 */
export function getVolumeTimeSeries(
    sessions: Session[],
    days: number = 30
): TimeSeriesPoint[] {
    const cacheKey = `getVolumeTimeSeries_${days}_${generateHistoryHash(sessions)}`;
    const cached = CacheManager.getMemory<TimeSeriesPoint[]>(cacheKey);
    if (cached) return cached;

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

    CacheManager.setMemory(cacheKey, result);
    return result;
}

/**
 * Get 1RM progression for a specific exercise
 */
export function get1RMProgression(
    sessions: Session[],
    exerciseId: string
): TimeSeriesPoint[] {
    const cacheKey = `get1RMProgression_${exerciseId}_${generateHistoryHash(sessions)}`;
    const cached = CacheManager.getMemory<TimeSeriesPoint[]>(cacheKey);
    if (cached) return cached;

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

    CacheManager.setMemory(cacheKey, result);
    return result;
}

/**
 * Get training frequency heatmap for the last 90 days
 */
export function getFrequencyHeatmap(sessions: Session[]): HeatmapPoint[] {
    const cacheKey = `getFrequencyHeatmap_${generateHistoryHash(sessions)}`;
    const cached = CacheManager.getMemory<HeatmapPoint[]>(cacheKey);
    if (cached) return cached;

    const days = 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const validSessions = sessions.filter(s => s.date >= cutoff && !s.deletedAt && s.isCompleted);

    const dailyCount = new Map<string, number>();
    const dailyVolume = new Map<string, number>();

    validSessions.forEach(session => {
        const dayKey = new Date(session.date).toISOString().split('T')[0];
        dailyCount.set(dayKey, (dailyCount.get(dayKey) || 0) + 1);
        dailyVolume.set(dayKey, (dailyVolume.get(dayKey) || 0) + session.volumeLoad);
    });

    const result: HeatmapPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        result.push({
            date: dayKey,
            count: dailyCount.get(dayKey) || 0,
            volume: dailyVolume.get(dayKey) || 0
        });
    }

    CacheManager.setMemory(cacheKey, result);
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
    const cacheKey = `getMuscleVolumeDistribution_${days}_${generateHistoryHash(sessions)}`;
    const cached = CacheManager.getMemory<MuscleVolumePoint[]>(cacheKey);
    if (cached) return cached;

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

    const result = muscles.map(muscle => ({
        muscle,
        volume: muscleVolume.get(muscle) || 0,
        percentage: totalVolume > 0
            ? Math.round((muscleVolume.get(muscle) || 0) / totalVolume * 100)
            : 0
    }));

    CacheManager.setMemory(cacheKey, result);
    return result;
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
    const cacheKey = `getWeeklySummary_${weeks}_${generateHistoryHash(sessions)}`;
    const cached = CacheManager.getMemory<any[]>(cacheKey);
    if (cached) return cached;

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

    const finalResult = result.reverse(); // Oldest first
    CacheManager.setMemory(cacheKey, finalResult);
    return finalResult;
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

/**
 * Computes the average session duration in minutes across all completed sessions.
 * Prefers session.endTime; falls back to the timestamp of the last completed set.
 * Filters out suspiciously short (<2 min) or long (>4 h) values to avoid outliers.
 */
export function getAvgSessionDuration(sessions: Session[]): number | null {
    const completed = sessions.filter(s => s.isCompleted && !s.deletedAt);
    if (completed.length === 0) return null;

    const durations = completed.map(s => {
        if (s.endTime && s.endTime > s.date) return s.endTime - s.date;
        const doneSets = s.sets.filter(st => st.isCompleted && st.timestamp > s.date);
        if (doneSets.length === 0) return 0;
        return Math.max(...doneSets.map(st => st.timestamp)) - s.date;
    }).filter(d => d >= 2 * 60_000 && d <= 4 * 60 * 60_000);

    if (durations.length === 0) return null;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60_000);
}

/**
 * Returns the average RPE per session for a given exercise (oldest-first).
 * Only includes sessions where RPE was actually recorded (rpe > 0).
 */
export function getRPEProgression(
    sessions: Session[],
    exerciseId: string
): TimeSeriesPoint[] {
    const result: TimeSeriesPoint[] = [];

    const sorted = [...sessions]
        .filter(s => !s.deletedAt && s.isCompleted)
        .sort((a, b) => a.date - b.date);

    sorted.forEach(session => {
        const sets = session.sets.filter(s => s.exerciseId === exerciseId && s.rpe > 0);
        if (sets.length === 0) return;
        const avgRPE = sets.reduce((acc, s) => acc + s.rpe, 0) / sets.length;
        result.push({
            date: session.date,
            value: Math.round(avgRPE * 10) / 10,
            label: new Date(session.date).toLocaleDateString()
        });
    });

    return result;
}

/**
 * Replays session history oldest-first to produce a per-muscle fatigue score
 * for each of the last `days` days.
 *
 * Uses the same half-life decay formula as fatigueModel.ts so values are
 * consistent with the live readiness widget.
 */
export interface MuscleFatigueSnapshot {
    date: number; // midnight timestamp
    /** 0–100 readiness score (100 = fully fresh) */
    scores: Partial<Record<MuscleGroup, number>>;
}

export function getMuscleFatigueTimeline(
    sessions: Session[],
    exercises: Exercise[],
    days: number = 14
): MuscleFatigueSnapshot[] {
    const cacheKey = `getMuscleFatigueTimeline_${days}_${generateHistoryHash(sessions)}`;
    const cached = CacheManager.getMemory<MuscleFatigueSnapshot[]>(cacheKey);
    if (cached) return cached;

    const HALF_LIVES: Partial<Record<MuscleGroup, number>> = {
        'upper legs': 24, back: 22, chest: 18, shoulders: 16,
        'lower legs': 12, arms: 12, core: 10, cardio: 8,
    };
    const MAX_CAPACITY: Partial<Record<MuscleGroup, number>> = {
        chest: 4000, back: 5000, 'upper legs': 7000, 'lower legs': 3000,
        shoulders: 2500, arms: 2000, core: 1500, cardio: 1200,
    };
    const trackedMuscles: MuscleGroup[] = ['chest', 'back', 'upper legs', 'lower legs', 'shoulders', 'arms'];
    const exerciseMap = new Map(exercises.map(e => [e.id, e]));

    // fatigue state in raw load units, keyed by muscle
    const fatigue: Partial<Record<MuscleGroup, number>> = {};
    trackedMuscles.forEach(m => { fatigue[m] = 0; });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startMs = today.getTime() - (days - 1) * 86_400_000;

    const sorted = [...sessions]
        .filter(s => s.isCompleted && !s.deletedAt)
        .sort((a, b) => a.date - b.date);

    // Snapshot per day: simulate fatigue accumulation
    const snapshots: MuscleFatigueSnapshot[] = [];
    let lastProcessedTs = sorted.length > 0 ? sorted[0].date : startMs;

    const applyDecay = (from: number, to: number) => {
        const hoursPassed = (to - from) / 3_600_000;
        trackedMuscles.forEach(m => {
            const halfLife = HALF_LIVES[m] ?? 18;
            fatigue[m] = (fatigue[m] ?? 0) * Math.pow(0.5, hoursPassed / halfLife);
        });
    };

    // Walk through sessions and accumulate fatigue
    let sessionIdx = 0;
    for (let d = 0; d < days; d++) {
        const dayStart = startMs + d * 86_400_000;
        const dayEnd = dayStart + 86_400_000;

        // Apply sessions that fall in this day
        while (sessionIdx < sorted.length && sorted[sessionIdx].date < dayEnd) {
            const session = sorted[sessionIdx];
            if (session.date >= dayStart) {
                applyDecay(lastProcessedTs, session.date);
                lastProcessedTs = session.date;
                session.sets.filter(s => s.isCompleted).forEach(set => {
                    const ex = exerciseMap.get(set.exerciseId);
                    if (!ex) return;
                    const load = set.weight * set.reps;
                    fatigue[ex.targetMuscle] = (fatigue[ex.targetMuscle] ?? 0) + load;
                });
            }
            sessionIdx++;
        }

        // Decay to end of day for snapshot
        applyDecay(lastProcessedTs, dayEnd);
        lastProcessedTs = dayEnd;

        // Compute readiness scores (0-100)
        const scores: Partial<Record<MuscleGroup, number>> = {};
        trackedMuscles.forEach(m => {
            const cap = MAX_CAPACITY[m] ?? 3000;
            scores[m] = Math.round(Math.max(0, Math.min(1, 1 - (fatigue[m] ?? 0) / cap)) * 100);
        });

        if (dayStart >= startMs) snapshots.push({ date: dayStart, scores });
    }

    CacheManager.setMemory(cacheKey, snapshots);
    return snapshots;
}

// --- E-03. Weekly Muscle Volume with Delta ---

export interface WeeklyMuscleVolumePoint {
    muscle: MuscleGroup;
    /** Total volume (kg Ã— reps) this week */
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
 * E-03 â€” Returns per-muscle volume for this week vs. last week.
 * Useful to detect imbalances and track progressive overload per muscle group.
 */
export function getWeeklyMuscleVolume(
    sessions: Session[],
    exercises: Exercise[]
): WeeklyMuscleVolumePoint[] {
    const cacheKey = `getWeeklyMuscleVolume_${generateHistoryHash(sessions)}`;
    const cached = CacheManager.getMemory<WeeklyMuscleVolumePoint[]>(cacheKey);
    if (cached) return cached;

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

    const result = muscles.map(muscle => {
        const { vol: thisWeek, setCount: sets } = calcVolume(thisWeekSessions, muscle);
        const { vol: lastWeek } = calcVolume(lastWeekSessions, muscle);
        const delta = thisWeek - lastWeek;
        const deltaPct = lastWeek > 0 ? (delta / lastWeek) * 100 : null;
        return { muscle, thisWeek, lastWeek, delta, deltaPct, sets };
    });

    CacheManager.setMemory(cacheKey, result);
    return result;
}

// ------------------------------------------------------