
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

        // Schema validation (typed guards)
        const isValidSession = (s: unknown): s is Session => {
            if (typeof s !== 'object' || s === null) return false;
            const o = s as Record<string, unknown>;
            return typeof o.id === 'string' && typeof o.date === 'number' && Array.isArray(o.sets);
        };
        const isValidExercise = (e: unknown): e is Exercise => {
            if (typeof e !== 'object' || e === null) return false;
            const o = e as Record<string, unknown>;
            return typeof o.id === 'string' && typeof o.name === 'string';
        };

        const validSessions = (rawSessions as unknown[]).filter(isValidSession);
        const validExercises = (rawExercises as unknown[]).filter(isValidExercise);

        if (validSessions.length !== rawSessions.length || validExercises.length !== rawExercises.length) {
            return { sessions: [], exercises: [], error: 'Arquivo JSON corrompido ou formato inválido.' };
        }

        return { sessions: validSessions, exercises: validExercises };
    } catch (e) {
        return { sessions: [], exercises: [], error: 'Arquivo JSON inválido. Verifique se o arquivo não está corrompido.' };
    }
}

// ──────────────────────────────────────────────────────────────
// Shared CSV helpers
// ──────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

function slugifyExercise(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function guessTargetMuscle(name: string): import('../types/domain').MuscleGroup {
    const n = name.toLowerCase();
    if (/chest|bench|fly|pec/.test(n)) return 'chest';
    if (/back|row|pull|lat|deadlift|rdl/.test(n)) return 'back';
    if (/squat|leg|quad|hamstring|glute|lunge/.test(n)) return 'upper legs';
    if (/calf|calves/.test(n)) return 'lower legs';
    if (/shoulder|delt|press.*over|ohp/.test(n)) return 'shoulders';
    if (/curl|tricep|bicep|arm/.test(n)) return 'arms';
    if (/crunch|plank|ab|core/.test(n)) return 'core';
    return 'back'; // safe default for compound movements
}

// ──────────────────────────────────────────────────────────────
// Hevy CSV Import
// Hevy export headers (v2+):
//   Date, Workout Name, Exercise Name, Set Order, Weight (kg), Reps, RPE, Notes
// ──────────────────────────────────────────────────────────────

export function parseHevyCSV(csvString: string): ImportResult {
    try {
        const lines = csvString.trim().split('\n');
        if (lines.length < 2) return { sessions: [], exercises: [], error: 'CSV vazio ou sem dados.' };

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

        const col = (name: string) => headers.indexOf(name);
        const dateCol   = col('date');
        const nameCol   = col('workoutname');
        const exCol     = col('exercisename');
        const weightCol = headers.findIndex(h => h.startsWith('weight'));
        const repsCol   = col('reps');
        const rpeCol    = col('rpe');

        if (dateCol === -1 || exCol === -1 || repsCol === -1) {
            return { sessions: [], exercises: [], error: 'Formato Hevy não reconhecido. Verifique o arquivo exportado.' };
        }

        const exerciseMap = new Map<string, Exercise>();
        const sessionMap = new Map<string, Session>();

        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            if (row.length < 4) continue;

            const rawDate  = row[dateCol]?.trim() ?? '';
            const wName    = row[nameCol]?.trim() || 'Hevy Import';
            const exName   = row[exCol]?.trim() || 'Unknown';
            const weightRaw = weightCol >= 0 ? parseFloat(row[weightCol] ?? '0') || 0 : 0;
            const reps     = parseInt(row[repsCol] ?? '0') || 0;
            const rpe      = rpeCol >= 0 ? parseFloat(row[rpeCol] ?? '0') || 0 : 0;

            // Normalise date
            const dateMs = new Date(rawDate).getTime();
            if (isNaN(dateMs)) continue;
            const dayKey = new Date(dateMs).toISOString().split('T')[0];
            const sessionKey = `${dayKey}_${wName}`;

            // Upsert exercise
            const exId = slugifyExercise(exName);
            if (!exerciseMap.has(exId)) {
                exerciseMap.set(exId, {
                    id: exId,
                    name: exName,
                    targetMuscle: guessTargetMuscle(exName),
                    gifUrl: '',
                    fatigueFactor: 1,
                    isUnilateral: false,
                });
            }

            // Upsert session
            if (!sessionMap.has(sessionKey)) {
                sessionMap.set(sessionKey, {
                    id: crypto.randomUUID(),
                    date: dateMs,
                    name: wName,
                    sets: [],
                    isCompleted: true,
                    volumeLoad: 0,
                });
            }
            const session = sessionMap.get(sessionKey)!;
            const e1RM = reps > 0 && weightRaw > 0 ? Math.round(weightRaw * (1 + reps / 30)) : 0;
            session.sets.push({
                id: crypto.randomUUID(),
                exerciseId: exId,
                weight: weightRaw,
                reps,
                rpe,
                timestamp: dateMs,
                estimated1RM: e1RM,
                isCompleted: true,
            });
            session.volumeLoad += weightRaw * reps;
        }

        if (sessionMap.size === 0) {
            return { sessions: [], exercises: [], error: 'Nenhuma sessão encontrada no CSV do Hevy.' };
        }

        return {
            sessions: Array.from(sessionMap.values()),
            exercises: Array.from(exerciseMap.values()),
        };
    } catch (e) {
        return { sessions: [], exercises: [], error: 'Erro ao processar CSV do Hevy.' };
    }
}

// ──────────────────────────────────────────────────────────────
// Strong CSV Import
// Strong export headers:
//   Date, Workout Name, Duration, Exercise Name, Set Order, Weight, Reps, Distance, Seconds, Notes, Workout Notes, RPE
// ──────────────────────────────────────────────────────────────

export function parseStrongCSV(csvString: string): ImportResult {
    try {
        const lines = csvString.trim().split('\n');
        if (lines.length < 2) return { sessions: [], exercises: [], error: 'CSV vazio ou sem dados.' };

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

        const col = (name: string) => headers.indexOf(name);
        const dateCol   = col('date');
        const nameCol   = col('workoutname');
        const exCol     = col('exercisename');
        const weightCol = col('weight');
        const repsCol   = col('reps');
        const rpeCol    = col('rpe');

        if (dateCol === -1 || exCol === -1 || repsCol === -1) {
            return { sessions: [], exercises: [], error: 'Formato Strong não reconhecido. Verifique o arquivo exportado.' };
        }

        const exerciseMap = new Map<string, Exercise>();
        const sessionMap = new Map<string, Session>();

        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            if (row.length < 4) continue;

            const rawDate   = row[dateCol]?.trim() ?? '';
            const wName     = row[nameCol]?.trim() || 'Strong Import';
            const exName    = row[exCol]?.trim() || 'Unknown';
            const weightRaw = weightCol >= 0 ? parseFloat(row[weightCol] ?? '0') || 0 : 0;
            const reps      = parseInt(row[repsCol] ?? '0') || 0;
            const rpe       = rpeCol >= 0 ? parseFloat(row[rpeCol] ?? '0') || 0 : 0;

            const dateMs = new Date(rawDate).getTime();
            if (isNaN(dateMs)) continue;
            const dayKey = new Date(dateMs).toISOString().split('T')[0];
            const sessionKey = `${dayKey}_${wName}`;

            const exId = slugifyExercise(exName);
            if (!exerciseMap.has(exId)) {
                exerciseMap.set(exId, {
                    id: exId,
                    name: exName,
                    targetMuscle: guessTargetMuscle(exName),
                    gifUrl: '',
                    fatigueFactor: 1,
                    isUnilateral: false,
                });
            }

            if (!sessionMap.has(sessionKey)) {
                sessionMap.set(sessionKey, {
                    id: crypto.randomUUID(),
                    date: dateMs,
                    name: wName,
                    sets: [],
                    isCompleted: true,
                    volumeLoad: 0,
                });
            }
            const session = sessionMap.get(sessionKey)!;
            const e1RM = reps > 0 && weightRaw > 0 ? Math.round(weightRaw * (1 + reps / 30)) : 0;
            session.sets.push({
                id: crypto.randomUUID(),
                exerciseId: exId,
                weight: weightRaw,
                reps,
                rpe,
                timestamp: dateMs,
                estimated1RM: e1RM,
                isCompleted: true,
            });
            session.volumeLoad += weightRaw * reps;
        }

        if (sessionMap.size === 0) {
            return { sessions: [], exercises: [], error: 'Nenhuma sessão encontrada no CSV do Strong.' };
        }

        return {
            sessions: Array.from(sessionMap.values()),
            exercises: Array.from(exerciseMap.values()),
        };
    } catch (e) {
        return { sessions: [], exercises: [], error: 'Erro ao processar CSV do Strong.' };
    }
}
