
import { Exercise, MuscleGroup, ApiExercise, ApiResponse } from '../types';
import { FALLBACK_EXERCISES } from '../data/fallbackExercises';
import { NetworkClient } from '../utils/network';
import { logger } from '../utils/logger';

// OSS ExerciseDB — https://oss.exercisedb.dev/api/v1
// Free, no auth required. Limit: max 25 per request.
const API_BASE_URL = import.meta.env.VITE_EXERCISE_API_URL ?? 'https://oss.exercisedb.dev/api/v1';
const BATCH_SIZE = Math.min(Number(import.meta.env.VITE_EXERCISE_API_BATCH_SIZE) || 20, 25);

// ─── OSS bodyParts reference (lowercase, exactly as the API returns them) ──────
// neck | lower arms | shoulders | cardio | upper arms | chest | lower legs | back | upper legs | waist

/**
 * Maps an OSS API bodyPart string to the app's internal MuscleGroup.
 * Input is lowercase as returned by the OSS API.
 */
export const mapBodyPartToMuscle = (apiBodyPart: string): MuscleGroup => {
    const normalized = (apiBodyPart || '').toLowerCase().trim();

    switch (normalized) {
        case 'chest':
            return 'chest';

        case 'back':
        case 'neck':
            return 'back';

        case 'shoulders':
            return 'shoulders';

        case 'waist':
            return 'core';

        case 'upper arms':
        case 'lower arms':
            return 'arms';

        case 'upper legs':
            return 'upper legs';

        case 'lower legs':
            return 'lower legs';

        case 'cardio':
            return 'cardio';

        default:
            // targetMuscle names occasionally appear here in cached V2 data — handle gracefully
            if (normalized.includes('pectoral') || normalized.includes('chest')) return 'chest';
            if (normalized.includes('quad') || normalized.includes('hamstring') || normalized.includes('glute') || normalized.includes('thigh') || normalized.includes('hip')) return 'upper legs';
            if (normalized.includes('calf') || normalized.includes('calves') || normalized.includes('shin')) return 'lower legs';
            if (normalized.includes('delt') || normalized.includes('shoulder')) return 'shoulders';
            if (normalized.includes('bicep') || normalized.includes('tricep') || normalized.includes('forearm') || normalized.includes('arm')) return 'arms';
            if (normalized.includes('lat') || normalized.includes('back') || normalized.includes('trap') || normalized.includes('rhomboid')) return 'back';
            if (normalized.includes('abs') || normalized.includes('oblique') || normalized.includes('core') || normalized.includes('waist')) return 'core';
            return 'cardio';
    }
};

/**
 * Translates the app's MuscleGroup / filter value to the OSS API `bodyParts` query param.
 * OSS API accepts lowercase exact bodyPart names, comma-separated for multiple.
 *
 * OSS bodyParts: chest | back | shoulders | upper arms | lower arms | upper legs | lower legs | waist | cardio | neck
 */
export const getApiBodyParts = (muscle: string): string => {
    if (!muscle || muscle === 'all') return '';
    const lower = muscle.toLowerCase().trim();

    switch (lower) {
        // App convenience groupings → comma-separated OSS bodyParts
        case 'arms':        return 'upper arms,lower arms';
        case 'upper legs':  return 'upper legs';
        case 'lower legs':  return 'lower legs';
        case 'core':
        case 'waist':       return 'waist';
        case 'back':        return 'back';
        case 'cardio':      return 'cardio';
        case 'shoulders':   return 'shoulders';
        case 'chest':       return 'chest';
        case 'neck':        return 'neck';

        // Specific V2 legacy values — map to closest OSS bodyPart
        case 'biceps':
        case 'triceps':
        case 'forearms':    return 'upper arms,lower arms';
        case 'quadriceps':
        case 'hamstrings':
        case 'hips':
        case 'thighs':
        case 'glutes':      return 'upper legs';
        case 'calves':
        case 'feet':        return 'lower legs';
        case 'full body':   return 'cardio';

        // OSS passthrough — assume caller already uses a valid OSS bodyPart
        default:            return lower;
    }
};

// ─── Movement Pattern Heuristic ─────────────────────────────────────────────

const detectMovementPattern = (
    name: string,
    secondaryMuscles: string[]
): Exercise['movementPattern'] => {
    const n = name.toLowerCase();
    const hasMany = secondaryMuscles.length > 1;

    if (hasMany && (n.includes('squat') || n.includes('deadlift') || n.includes('bench') || n.includes('press') || n.includes('row') || n.includes('pull'))) {
        return 'compound';
    }
    if (n.includes('press') || n.includes('push') || n.includes('fly') || n.includes('flye') || n.includes('raise') || n.includes('extension')) {
        return 'push';
    }
    if (n.includes('row') || n.includes('pull') || n.includes('curl') || n.includes('face pull') || n.includes('pulldown')) {
        return 'pull';
    }
    return 'isolation';
};

// ─── Fatigue Factor ──────────────────────────────────────────────────────────

const calcFatigueFactor = (equipment: string, secondaryMuscles: string[]): number => {
    const e = equipment.toLowerCase();
    const isCompound = secondaryMuscles.length > 1;
    const isBarbell = e === 'barbell' || e === 'olympic barbell' || e === 'ez barbell' || e === 'trap bar';
    const isMachine = e.includes('machine') || e === 'cable' || e === 'sled machine' || e === 'leverage machine';
    const isBodyweight = e === 'body weight' || e === 'assisted' || e === 'weighted';

    if (isBarbell && isCompound) return 1.5;
    if (isBarbell) return 1.2;
    if (isMachine) return 0.9;
    if (isBodyweight) return 0.8;
    return 1.0;
};

// ─── API → Exercise Model ────────────────────────────────────────────────────

const mapApiToModel = (apiEx: ApiExercise): Exercise => {
    try {
        const bodyPart = apiEx.bodyParts?.[0] ?? '';
        const name = apiEx.name ?? 'Unknown';
        const nameLower = name.toLowerCase();
        const equipment = (apiEx.equipments?.[0] ?? 'body weight').toLowerCase();
        const secondaryMuscles = apiEx.secondaryMuscles ?? [];

        const targetMuscle: MuscleGroup = mapBodyPartToMuscle(bodyPart);

        // OSS GIF URL: always https://static.exercisedb.dev/media/{exerciseId}.gif
        // Prefer the API-supplied gifUrl; construct from exerciseId if missing.
        const gifUrl =
            apiEx.gifUrl ||
            (apiEx.exerciseId ? `https://static.exercisedb.dev/media/${apiEx.exerciseId}.gif` : '') ||
            apiEx.imageUrl || // V2 compat
            (apiEx.imageUrls?.['480p'] ?? '') || // V2 compat
            '';

        // "Single", "one arm/leg", "unilateral" → truly unilateral
        // Note: "dumbbell" alone does NOT mean unilateral
        const isUnilateral =
            nameLower.includes('single') ||
            nameLower.includes('one arm') ||
            nameLower.includes('one-arm') ||
            nameLower.includes('unilateral') ||
            nameLower.includes('single-arm') ||
            nameLower.includes('single leg') ||
            nameLower.includes('one leg');

        return {
            id: apiEx.exerciseId || crypto.randomUUID(),
            name: name.replace(/\b\w/g, l => l.toUpperCase()),
            targetMuscle,
            gifUrl,
            staticImageUrl: gifUrl ? `https://wsrv.nl/?url=${encodeURIComponent(gifUrl)}&n=1&output=png` : '', // OSS only supplies GIFs; generate PNG preview
            videoUrl: apiEx.videoUrl ?? '',
            fatigueFactor: calcFatigueFactor(equipment, secondaryMuscles),
            isUnilateral,
            movementPattern: detectMovementPattern(nameLower, secondaryMuscles),
            instructions: apiEx.instructions ?? [],
            overview: apiEx.overview ?? '',
            tips: apiEx.exerciseTips ?? [],
            variations: apiEx.variations ?? [],
            equipment,
            secondaryMuscles,
        };
    } catch (error) {
        logger.warn('ExerciseService', 'mapApiToModel error', error);
        return {
            id: apiEx?.exerciseId || crypto.randomUUID(),
            name: apiEx?.name || 'Unknown',
            targetMuscle: 'cardio',
            gifUrl: apiEx?.gifUrl ?? '',
            fatigueFactor: 1,
            isUnilateral: false,
        };
    }
};

// ─── Public API ──────────────────────────────────────────────────────────────

export interface PaginatedResult {
    data: Exercise[];
    nextCursor: string | null;
    total?: number;
}

/**
 * Unified fetcher — search, muscle filter, and cursor-based pagination.
 *
 * OSS params:
 *   name        fuzzy search (same as search)
 *   bodyParts   comma-separated lowercase bodyPart names
 *   limit       1-25 (default 10)
 *   after       exerciseId cursor for next page
 */
export const getExercises = async (options: {
    search?: string;
    muscle?: string;
    cursor?: string;
}): Promise<PaginatedResult> => {
    const { search, muscle, cursor } = options;

    const params: Record<string, string | number> = {
        limit: BATCH_SIZE,
    };

    if (cursor) params.after = cursor;

    if (search?.trim()) params.name = search.trim();

    if (muscle && muscle !== 'all') {
        const bodyParts = getApiBodyParts(muscle);
        if (bodyParts) params.bodyParts = bodyParts;
    }

    const cacheKey = `req_oss_${JSON.stringify(params)}`;
    const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

    try {
        const response = await NetworkClient.get<ApiResponse>(
            `${API_BASE_URL}/exercises`,
            { params },
            cacheKey,
            CACHE_TTL
        );

        const items = Array.isArray(response?.data) ? response.data : [];

        return {
            data: items.map(mapApiToModel),
            nextCursor: response?.meta?.nextCursor ?? null,
            total: response?.meta?.total,
        };
    } catch (error: unknown) {
        logger.warn('ExerciseService', 'getExercises failed', error);
        return { data: [], nextCursor: null };
    }
};

/**
 * Fetch a single exercise by ID.
 * Checks store's FALLBACK_EXERCISES first, then hits the detail endpoint.
 */
export const getExerciseById = async (id: string): Promise<Exercise | null> => {
    const local = FALLBACK_EXERCISES.find(e => e.id === id);
    if (local) return local;

    const cacheKey = `ex_detail_oss_${id}`;

    try {
        const response = await NetworkClient.get<ApiResponse>(
            `${API_BASE_URL}/exercises/${id}`,
            {},
            cacheKey,
            1000 * 60 * 60 * 24 * 7 // 7d cache for details
        );

        const item = response?.data;
        if (item && !Array.isArray(item)) {
            return mapApiToModel(item as ApiExercise);
        }
        return null;
    } catch (error) {
        logger.warn('ExerciseService', `getExerciseById(${id}) failed`, error);
        return null;
    }
};

/**
 * Search exercises using the dedicated fuzzy-search endpoint.
 * Falls back to the main endpoint search if needed.
 */
export const searchExercises = async (
    query: string,
    threshold = 0.4
): Promise<Exercise[]> => {
    if (!query.trim()) return [];

    const cacheKey = `search_oss_${query.toLowerCase()}_${threshold}`;
    const CACHE_TTL = 1000 * 60 * 60 * 6; // 6h for search results

    try {
        const response = await NetworkClient.get<ApiResponse>(
            `${API_BASE_URL}/exercises/search`,
            { params: { search: query.trim(), threshold } },
            cacheKey,
            CACHE_TTL
        );

        const items = Array.isArray(response?.data) ? response.data : [];
        return items.map(mapApiToModel);
    } catch {
        // Fallback to main endpoint with name param
        const result = await getExercises({ search: query });
        return result.data;
    }
};

// ─── Legacy Wrappers (kept for backward compat with existing callers) ────────

export const fetchExercises = (cursor?: string): Promise<PaginatedResult> =>
    getExercises({ cursor });

export const getExercisesByMuscle = (muscle: string, cursor?: string): Promise<PaginatedResult> =>
    getExercises({ muscle, cursor });
