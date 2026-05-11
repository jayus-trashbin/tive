
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
        'data', 'nome_sessao', 'id_rotina',
        'exercicio', 'musculo_alvo', 'numero_serie', 'tipo_serie',
        'peso_kg', 'repeticoes', 'rpe', '1rm_estimado', 'pr', 'volume'
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
 * Parses a Tive backup JSON file with strict schema validation.
 * Returns sessions and exercises arrays, or an error message.
 */
export function parseBackupJSON(jsonString: string): ImportResult {
    try {
        const parsed = JSON.parse(jsonString);

        // Support both flat backup {history, exercises} and nested Zustand persist format
        const state = parsed.state ?? parsed;
        const rawSessions = Array.isArray(state.history) ? state.history : [];
        const rawExercises = Array.isArray(state.exercises) ? state.exercises : [];

        if (rawSessions.length === 0 && rawExercises.length === 0) {
            return { sessions: [], exercises: [], error: 'Nenhum dado encontrado no arquivo.' };
        }

        // Schema validation
        const isValidSession = (s: any) => typeof s === 'object' && s !== null && typeof s.id === 'string' && typeof s.date === 'number' && Array.isArray(s.sets);
        const isValidExercise = (e: any) => typeof e === 'object' && e !== null && typeof e.id === 'string' && typeof e.name === 'string';

        const invalidSessions = rawSessions.filter((s: any) => !isValidSession(s));
        const invalidExercises = rawExercises.filter((e: any) => !isValidExercise(e));

        if (invalidSessions.length > 0 || invalidExercises.length > 0) {
            return { sessions: [], exercises: [], error: 'Arquivo JSON corrompido ou formato inválido.' };
        }

        return { sessions: rawSessions as Session[], exercises: rawExercises as Exercise[] };
    } catch (e) {
        return { sessions: [], exercises: [], error: 'Arquivo JSON inválido. Verifique se o arquivo não está corrompido.' };
    }
}

/**
 * Placeholder for Hevy CSV Import
 */
export function parseHevyCSV(csvString: string): ImportResult {
    // TODO: Phase 3.4 - Map Hevy headers (Date, Workout Name, Exercise Name, Set Order, Weight, Reps)
    return { sessions: [], exercises: [], error: 'Importação do Hevy ainda em desenvolvimento.' };
}

/**
 * Placeholder for Strong CSV Import
 */
export function parseStrongCSV(csvString: string): ImportResult {
    // TODO: Phase 3.4 - Map Strong headers (Date, Workout Name, Exercise Name, Set Order, Weight, Reps)
    return { sessions: [], exercises: [], error: 'Importação do Strong ainda em desenvolvimento.' };
}
