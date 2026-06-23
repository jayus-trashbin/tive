
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useWorkoutStore } from "../store/useWorkoutStore";
import { Routine, RoutineBlock, SetType } from "../types";
import { logger } from '../utils/logger';
import { calculateACWR } from '../utils/engine';
import { getWeeklyMuscleVolume } from '../utils/analytics';
import { Session, Exercise, MuscleGroup } from '../types/domain';

// Define the response structure we expect/return
export interface AIResponse {
    routine?: Routine;
    message?: string;
}

export interface AIInsight {
    type: 'success' | 'warning' | 'info';
    title: string;
    description: string;
    action?: {
        label: string;
        type: 'DELOAD_ADVICE' | 'ROUTINE_PLANNER' | 'VIEW_HISTORY';
    };
}

export interface InsightsResponse {
    insights: AIInsight[];
    source: 'local' | 'ai';
    message?: string;
}

export const generateRoutine = async (userInput: string): Promise<AIResponse> => {
    try {
        const { userStats, exercises } = useWorkoutStore.getState();
        const apiKey = userStats.geminiApiKey;

        if (!apiKey) {
            return { message: "API Key missing. Please configure your AI settings in your profile." };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Prepare context: Available Exercises (simplified to save tokens/noise)
        const exerciseList = exercises.map(e => ({ id: e.id, name: e.name, muscle: e.targetMuscle }));
        const exerciseContext = JSON.stringify(exerciseList);

        const prompt = `
        You are an expert strength and conditioning coach.
        Your task is to parse the user's input and generate a structured Workout Routine in JSON format.
        
        USER INPUT:
        "${userInput}"

        AVAILABLE EXERCISES (Use these IDs if possible, matching by name. If no exact match, choose the closest equivalent or use 'custom-placeholder' as ID and I will handle it):
        ${exerciseContext}

        OUTPUT FORMAT:
        Return ONLY valid JSON (no markdown backticks) with this structure:
        {
            "name": "Routine Name",
            "blocks": [
                {
                    "exerciseId": "id_from_list_or_closest_match",
                    "sets": [
                        { "type": "warmup"|"working"|"failure", "targetReps": "8-12", "targetRpe": 8 }
                    ],
                    "notes": "Optional styling notes"
                }
            ]
        }
        
        RULES:
        1. If the user input is vague (e.g., "Leg Day"), generate a balanced hypertrophy routine using available exercises.
        2. Ensure reasonable RPE (7-9) and Rep Ranges (e.g., "3x10" means 3 working sets of 10).
        3. Parse any specific weights if mentioned (e.g. "Bench 100kg").
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean Markdown if present
        if (text.startsWith("```json")) {
            text = text.replace(/```json/g, "").replace(/```/g, "");
        } else if (text.startsWith("```")) {
            text = text.replace(/```/g, "");
        }

        const data = JSON.parse(text);

        // Map to internal Routine type
        const routineId = crypto.randomUUID();
        const blocks: RoutineBlock[] = (data.blocks || []).map((b: any) => ({
            id: crypto.randomUUID(),
            exerciseId: b.exerciseId,
            sets: (b.sets || []).map((s: any) => ({
                id: crypto.randomUUID(),
                type: s.type || 'working',
                targetReps: s.targetReps || '10',
                targetRpe: s.targetRpe || 8,
                targetWeight: s.targetWeight
            })),
            isSuperset: false,
            notes: b.notes
        }));

        const routine: Routine = {
            id: routineId,
            name: data.name || "AI Generated Routine",
            exerciseIds: blocks.map((b) => b.exerciseId), // Legacy support
            blocks: blocks,
            updatedAt: Date.now()
        };

        return { routine, message: "Routine generated successfully!" };

    } catch (error: any) {
        logger.error('AIService', 'Routine generation failed', error);
        return { message: `AI Error: ${error.message || "Unknown error"}` };
    }
};

export const generateLocalInsights = (history: Session[], exercises: Exercise[]): AIInsight[] => {
    const insights: AIInsight[] = [];
    try {
        const acwr = calculateACWR(history);
        if (acwr && acwr.ratio > 1.3) {
            insights.push({
                type: 'warning',
                title: 'Fatigue Alert (ACWR)',
                description: `Your acute load is ${Math.round((acwr.ratio - 1) * 100)}% above your chronic baseline. Consider a deload to prevent injury.`,
                action: {
                    label: 'Plan Deload',
                    type: 'DELOAD_ADVICE'
                }
            });
        }
        
        const weeklyVolume = getWeeklyMuscleVolume(history, exercises);
        const topGrowth = weeklyVolume.filter(v => v.deltaPct !== null && v.deltaPct > 0).sort((a, b) => (b.deltaPct || 0) - (a.deltaPct || 0))[0];
        const topDrop = weeklyVolume.filter(v => v.deltaPct !== null && v.deltaPct < 0).sort((a, b) => (a.deltaPct || 0) - (b.deltaPct || 0))[0];
        
        if (topGrowth && topGrowth.deltaPct! > 20) {
            insights.push({
                type: 'success',
                title: 'Progressive Overload',
                description: `Your ${topGrowth.muscle} volume increased by ${Math.round(topGrowth.deltaPct!)}% this week. Strong progress.`
            });
        } else if (topDrop && topDrop.deltaPct! < -30) {
            insights.push({
                type: 'info',
                title: 'Volume Variance',
                description: `Your ${topDrop.muscle} volume dropped by ${Math.round(Math.abs(topDrop.deltaPct!))}% this week. Focus on consistency in your next session.`
            });
        }
        
        if (insights.length === 0) {
            insights.push({
                type: 'info',
                title: 'Consistency is Key',
                description: 'Keep logging your workouts to unlock deeper insights into your physiological progress and recovery.'
            });
        }
    } catch(e) {
        logger.error('AIService', 'Local insights failed', e);
    }
    return insights;
};

export const generateInsights = async (): Promise<InsightsResponse> => {
    const { history, exercises, userStats } = useWorkoutStore.getState();
    const localInsights = generateLocalInsights(history, exercises);
    
    const apiKey = userStats.geminiApiKey;
    if (!apiKey) {
        return { insights: localInsights, source: 'local' };
    }
    
    const cacheKey = 'tive_ai_insights_cache';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                return { insights: parsed.insights, source: 'ai', message: 'Loaded from cache' };
            }
        } catch(e) {}
    }
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const weeklyVol = getWeeklyMuscleVolume(history, exercises);
        const acwr = calculateACWR(history);
        
        const context = JSON.stringify({
            weeklyMuscleVolumeDelta: weeklyVol.map(v => ({ muscle: v.muscle, thisWeek: v.thisWeek, deltaPct: v.deltaPct })),
            acwr: acwr ? acwr.ratio : null
        });
        
        const prompt = `
        You are an expert strength and conditioning AI coach for Tive Strength OS.
        Analyze this athlete's training data from the past 2 weeks and provide exactly 3 short, high-value actionable insights in JSON format.
        
        ATHLETE DATA:
        ${context}
        
        OUTPUT FORMAT (JSON ONLY):
        {
            "insights": [
                { "type": "success"|"warning"|"info", "title": "Professional Title", "description": "1 short, scientific and motivating sentence.", "action": { "label": "Button text", "type": "DELOAD_ADVICE" } }
            ]
        }
        
        RULES:
        1. Language: ALWAYS use English.
        2. Tone: Professional, data-driven, and minimalist. No emojis.
        3. Priority: Fatigue management (ACWR > 1.3), Significant volume drops, and Progressive overload achievements.
        `;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        if (text.startsWith("\`\`\`json")) text = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "");
        else if (text.startsWith("\`\`\`")) text = text.replace(/\`\`\`/g, "");
        
        const data = JSON.parse(text);
        
        if (data.insights && Array.isArray(data.insights)) {
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                insights: data.insights
            }));
            return { insights: data.insights, source: 'ai' };
        }
        
        throw new Error("Invalid AI response format");
    } catch (error: any) {
        logger.error('AIService', 'AI Insights generation failed', error);
        return { insights: localInsights, source: 'local', message: `AI Fallback: ${error.message || "Rate limit or error"}` };
    }
};

// ─── Table-Based Routine Builder ─────────────────────────────────────────────

export interface ParsedDay {
    dayName: string;
    muscles: MuscleGroup[];
    setsPerExercise: number;
    repsTarget: string;
    routine: Routine;
}

export interface TableBuildResult {
    days: ParsedDay[];
    message: string;
    source: 'local' | 'ai';
}

// PT-BR day name → 0-6 (Mon=0)
const DAY_MAP_PTBR: Record<string, string> = {
    'segunda': 'Segunda-feira', 'seg': 'Segunda-feira',
    'terça': 'Terça-feira', 'terca': 'Terça-feira', 'ter': 'Terça-feira',
    'quarta': 'Quarta-feira', 'qua': 'Quarta-feira',
    'quinta': 'Quinta-feira', 'qui': 'Quinta-feira',
    'sexta': 'Sexta-feira', 'sex': 'Sexta-feira',
    'sábado': 'Sábado', 'sabado': 'Sábado', 'sab': 'Sábado',
    'domingo': 'Domingo', 'dom': 'Domingo',
    'monday': 'Segunda-feira', 'mon': 'Segunda-feira',
    'tuesday': 'Terça-feira', 'tue': 'Terça-feira',
    'wednesday': 'Quarta-feira', 'wed': 'Quarta-feira',
    'thursday': 'Quinta-feira', 'thu': 'Quinta-feira',
    'friday': 'Sexta-feira', 'fri': 'Sexta-feira',
    'saturday': 'Sábado', 'sat': 'Sábado',
    'sunday': 'Domingo', 'sun': 'Domingo',
};

// PT-BR muscle name → MuscleGroup
const MUSCLE_MAP_PTBR: Record<string, MuscleGroup> = {
    'peito': 'chest', 'peitoral': 'chest', 'chest': 'chest',
    'costas': 'back', 'costa': 'back', 'back': 'back', 'dorsal': 'back', 'lat': 'back', 'latissimo': 'back',
    'perna': 'upper legs', 'pernas': 'upper legs', 'quadriceps': 'upper legs', 'quad': 'upper legs',
    'femoral': 'upper legs', 'legs': 'upper legs', 'leg': 'upper legs',
    'panturrilha': 'lower legs', 'calf': 'lower legs', 'calves': 'lower legs',
    'ombro': 'shoulders', 'ombros': 'shoulders', 'shoulder': 'shoulders', 'shoulders': 'shoulders', 'deltóide': 'shoulders',
    'bíceps': 'arms', 'biceps': 'arms', 'bícep': 'arms', 'tríceps': 'arms', 'triceps': 'arms',
    'braço': 'arms', 'braços': 'arms', 'arms': 'arms', 'arm': 'arms',
    'core': 'core', 'abdômen': 'core', 'abdomen': 'core', 'abs': 'core', 'abdominal': 'core',
    'cardio': 'cardio',
};

function parseSetReps(text: string): { sets: number; reps: string } {
    // Matches: 4x10, 3×12, 4 sets de 10, 3 séries 8-12
    const matchX = text.match(/(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)/);
    if (matchX) return { sets: parseInt(matchX[1]), reps: matchX[2] };

    const matchSets = text.match(/(\d+)\s*(?:set|série|series|sets)\w*\s*(?:de|of)?\s*(\d+(?:-\d+)?)/i);
    if (matchSets) return { sets: parseInt(matchSets[1]), reps: matchSets[2] };

    return { sets: 3, reps: '8-12' }; // sensible default
}

function parseMuscles(text: string): MuscleGroup[] {
    const lower = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const found: MuscleGroup[] = [];

    for (const [key, muscle] of Object.entries(MUSCLE_MAP_PTBR)) {
        const normalized = key.normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (lower.includes(normalized) && !found.includes(muscle)) {
            found.push(muscle);
        }
    }

    return found;
}

function buildDayRoutine(
    dayLabel: string,
    muscles: MuscleGroup[],
    sets: number,
    reps: string,
    exercises: Exercise[],
    userHistory: Session[]
): Routine {
    const routineId = crypto.randomUUID();

    // Get exercises per muscle, sorted: compound first, then isolation
    // Prefer exercises the user has done before
    const usedExerciseIds = new Set(userHistory.flatMap(s => s.sets.map(ws => ws.exerciseId)));

    const selectedBlocks: RoutineBlock[] = [];

    muscles.forEach(muscle => {
        const candidates = exercises
            .filter(e => e.targetMuscle === muscle && !e.deletedAt)
            .sort((a, b) => {
                // Prefer compound over isolation
                const aScore = (a.movementPattern === 'compound' ? 2 : 0) + (usedExerciseIds.has(a.id) ? 1 : 0);
                const bScore = (b.movementPattern === 'compound' ? 2 : 0) + (usedExerciseIds.has(b.id) ? 1 : 0);
                return bScore - aScore;
            });

        const picked = candidates.slice(0, 2); // max 2 exercises per muscle
        picked.forEach(ex => {
            const workingSets = Math.max(2, Math.min(sets, 4));
            selectedBlocks.push({
                id: crypto.randomUUID(),
                exerciseId: ex.id,
                isSuperset: false,
                restSeconds: muscles.length > 1 && ex.movementPattern === 'compound' ? 180 : 90,
                sets: Array.from({ length: workingSets }, () => ({
                    id: crypto.randomUUID(),
                    type: 'working' as SetType,
                    targetReps: reps,
                    targetRpe: 8,
                })),
            });
        });
    });

    return {
        id: routineId,
        name: dayLabel,
        exerciseIds: selectedBlocks.map(b => b.exerciseId),
        blocks: selectedBlocks,
        updatedAt: Date.now(),
    };
}

/**
 * Deterministic table parser: builds one Routine per detected day.
 * Input example: "Segunda: peito + tríceps 4x10\nTerça: costas 3x12"
 */
const buildRoutineFromTableLocal = (tableText: string): TableBuildResult => {
    const { exercises, history } = useWorkoutStore.getState();
    const lines = tableText.split('\n').map(l => l.trim()).filter(Boolean);
    const days: ParsedDay[] = [];

    for (const line of lines) {
        // Detect day token (everything before the colon or first muscle keyword)
        const colonIdx = line.indexOf(':');
        let dayToken = '';
        let bodyText = line;

        if (colonIdx !== -1) {
            dayToken = line.slice(0, colonIdx).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
            bodyText = line.slice(colonIdx + 1).trim();
        } else {
            // Try to detect day in the first word
            const firstWord = line.split(/\s/)[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
            if (DAY_MAP_PTBR[firstWord]) {
                dayToken = firstWord;
                bodyText = line.slice(firstWord.length).trim();
            }
        }

        const dayName = DAY_MAP_PTBR[dayToken] ?? dayToken;
        if (!dayName) continue;

        const muscles = parseMuscles(bodyText);
        if (muscles.length === 0) continue;

        const { sets, reps } = parseSetReps(bodyText);
        const routine = buildDayRoutine(dayName, muscles, sets, reps, exercises, history);

        days.push({ dayName, muscles, setsPerExercise: sets, repsTarget: reps, routine });
    }

    return {
        days,
        message: days.length > 0
            ? `Built ${days.length} routine(s) from your table.`
            : 'No valid days detected. Use format: "Segunda: peito + tríceps 4x10"',
        source: 'local',
    };
};

/**
 * AI-enhanced parser: sends the text to Gemini for disambiguation,
 * then falls back to deterministic parser if no API key.
 */
export const buildRoutineFromTable = async (tableText: string): Promise<TableBuildResult> => {
    const { userStats } = useWorkoutStore.getState();
    const apiKey = userStats.geminiApiKey;

    if (!apiKey) {
        return buildRoutineFromTableLocal(tableText);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
You are a fitness assistant. Parse the following workout table and return a JSON array.
Each item = one training day with its muscle groups and set/rep scheme.

INPUT:
${tableText}

OUTPUT FORMAT (valid JSON only, no markdown):
[
  { "dayName": "Day name in PT-BR", "muscles": ["chest","back","upper legs","lower legs","shoulders","arms","core","cardio"], "sets": 3, "reps": "8-12" }
]

Valid muscle values: chest, back, upper legs, lower legs, shoulders, arms, core, cardio.
`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        if (text.startsWith('```')) text = text.replace(/```json?/g, '').replace(/```/g, '').trim();

        const parsed: Array<{ dayName: string; muscles: MuscleGroup[]; sets: number; reps: string }> = JSON.parse(text);
        const { exercises, history } = useWorkoutStore.getState();

        const days: ParsedDay[] = parsed.map(item => {
            const routine = buildDayRoutine(item.dayName, item.muscles, item.sets, item.reps, exercises, history);
            return { dayName: item.dayName, muscles: item.muscles, setsPerExercise: item.sets, repsTarget: item.reps, routine };
        });

        return { days, message: `AI built ${days.length} routine(s).`, source: 'ai' };
    } catch (error: any) {
        logger.warn('AIService', 'buildRoutineFromTable AI failed, using local parser', error.message);
        return buildRoutineFromTableLocal(tableText);
    }
};
