
import { Session, Exercise } from '../types';

// ──────────────────────────────────────────────────────────────
// A-06 — Export to CSV
// ──────────────────────────────────────────────────────────────

/**
 * Converts all completed sets across all sessions to a flat CSV string,
 * one row per set with session metadata attached.
 */
export function exportToCSV(sessions: Session[], exercises: Exercise[]): string {
    const exerciseMap = new Map(exercises.map(e => [e.id, e]));

    const header = [
        'date', 'session_name', 'routine_id',
        'exercise', 'muscle', 'set_index', 'type',
        'weight_kg', 'reps', 'rpe', 'estimated_1rm', 'is_pr', 'volume'
    ].join(',');

    const rows: string[] = [header];

    const sorted = [...sessions]
        .filter(s => s.isCompleted && !s.deletedAt)
        .sort((a, b) => a.date - b.date);

    sorted.forEach(session => {
        const dateStr = new Date(session.date).toISOString().split('T')[0];
        const exerciseSets = new Map<string, number>(); // track set index per exercise

        session.sets.filter(s => s.isCompleted).forEach(set => {
            const ex = exerciseMap.get(set.exerciseId);
            const exName = ex?.name || set.exerciseId;
            const muscle = ex?.targetMuscle || '';
            const idx = (exerciseSets.get(set.exerciseId) || 0) + 1;
            exerciseSets.set(set.exerciseId, idx);

            const row = [
                dateStr,
                `"${session.name?.replace(/"/g, '""') || ''}"`,
                session.routineId || '',
                `"${exName.replace(/"/g, '""')}"`,
                muscle,
                idx,
                set.type || 'working',
                set.weight,
                set.reps,
                set.rpe || '',
                set.estimated1RM || '',
                set.isPR ? '1' : '0',
                (set.weight * set.reps).toFixed(0)
            ].join(',');

            rows.push(row);
        });
    });

    return rows.join('\n');
}

/** Triggers browser download of a CSV file. */
export function downloadCSV(csv: string, filename = 'tive-export.csv'): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/** Triggers browser download of a JSON backup. */
export function downloadJSON(data: object, filename = 'tive-backup.json'): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────────────────────────
// A-07 — Import backup JSON
// ──────────────────────────────────────────────────────────────

export interface ImportResult {
    sessions: Session[];
    exercises: Exercise[];
    error?: string;
}

/**
 * Parses a Tive backup JSON file.
 * Returns sessions and exercises arrays, or an error message.
 */
export function parseBackupJSON(jsonString: string): ImportResult {
    try {
        const parsed = JSON.parse(jsonString);

        // Support both flat backup {history, exercises} and nested Zustand persist format
        const state = parsed.state ?? parsed;
        const sessions: Session[] = Array.isArray(state.history) ? state.history : [];
        const exercises: Exercise[] = Array.isArray(state.exercises) ? state.exercises : [];

        if (sessions.length === 0 && exercises.length === 0) {
            return { sessions: [], exercises: [], error: 'No data found in this file.' };
        }

        return { sessions, exercises };
    } catch (e) {
        return { sessions: [], exercises: [], error: 'Invalid JSON file. Please select a valid Tive backup.' };
    }
}
