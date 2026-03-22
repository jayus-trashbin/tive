
import { Exercise, MuscleGroup, ApiExercise, ApiResponse } from '../types';
import { FALLBACK_EXERCISES } from '../data/fallbackExercises';
import { NetworkClient } from '../utils/network';

const API_BASE_URL = 'https://exercisedbv2.ascendapi.com/api/v1';
const BATCH_SIZE = 20; // Reduced from 25 to be safer with rate limits

// --- MAPPING HELPERS ---

/**
 * Maps the specific API body part (e.g. "QUADRICEPS") to the internal application MuscleGroup (e.g. "upper legs")
 * Used for fatigue tracking and symmetry analysis stats.
 */
const mapBodyPartToMuscle = (apiBodyPart: string): MuscleGroup => {
    const normalized = (apiBodyPart || '').toUpperCase();

    switch (normalized) {
        case 'CHEST':
            return 'chest';

        case 'BACK':
        case 'NECK':
            return 'back';

        case 'SHOULDERS':
            return 'shoulders';

        case 'WAIST':
            return 'core';

        case 'ARMS':
        case 'UPPER ARMS':
        case 'BICEPS':
        case 'TRICEPS':
        case 'FOREARMS':
        case 'HANDS':
            return 'arms';

        case 'UPPER LEGS':
        case 'THIGHS':
        case 'HAMSTRINGS':
        case 'QUADRICEPS':
        case 'HIPS':
            return 'upper legs';

        case 'LOWER LEGS':
        case 'CALVES':
        case 'FEET':
            return 'lower legs';

        case 'CARDIO':
        case 'FULL BODY':
            return 'cardio';

        default:
            return 'cardio';
    }
};

/**
 * Translates UI selection to API Query Parameter.
 * Documentation: "Filter exercises by body parts. Use comma-separated values."
 */
const getApiBodyParts = (muscle: string): string => {
    if (!muscle || muscle === 'all') return '';
    const lower = muscle.toLowerCase();

    // 1. Aggregates (App-Specific Groupings for easier browsing)
    if (lower === 'arms') return 'UPPER ARMS,FOREARMS,BICEPS,TRICEPS';
    if (lower === 'upper legs') return 'THIGHS,HAMSTRINGS,QUADRICEPS,HIPS';
    if (lower === 'lower legs') return 'CALVES,FEET';
    if (lower === 'core') return 'WAIST';
    if (lower === 'back') return 'BACK,NECK';
    if (lower === 'cardio') return 'FULL BODY';

    // 2. Specific API Keys (Direct passthrough - ensures exact match with API enums)
    return muscle.toUpperCase();
};

const mapApiToModel = (apiEx: ApiExercise): Exercise => {
    try {
        const bodyPart = apiEx.bodyParts?.[0] || '';
        const name = apiEx.name?.toLowerCase() || 'unknown';
        const equipment = apiEx.equipments?.[0]?.toLowerCase() || 'unknown';

        let targetMuscle: MuscleGroup = mapBodyPartToMuscle(bodyPart);

        // Fatigue Logic Calculation
        let fatigueFactor = 1.0;
        const isCompound = (apiEx.secondaryMuscles?.length || 0) > 1;
        const isBarbell = equipment === 'barbell';
        const isMachine = equipment.includes('machine') || equipment === 'cable';

        if (isBarbell && isCompound) fatigueFactor = 1.5;
        else if (isBarbell) fatigueFactor = 1.2;
        else if (isMachine) fatigueFactor = 0.9;
        else if (equipment === 'body weight') fatigueFactor = 0.8;

        // Resolve Best Image (Priority: 1080p > 720p > ImageUrl > GifUrl)
        const bestImage =
            apiEx.imageUrls?.['1080p'] ||
            apiEx.imageUrls?.['720p'] ||
            apiEx.imageUrls?.['480p'] ||
            apiEx.imageUrl ||
            apiEx.gifUrl ||
            '';

        return {
            id: apiEx.exerciseId || crypto.randomUUID(),
            name: apiEx.name ? apiEx.name.replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown',
            targetMuscle,
            gifUrl: apiEx.gifUrl || bestImage, // Fallback for low-bandwidth
            staticImageUrl: bestImage,
            videoUrl: apiEx.videoUrl || '',
            fatigueFactor,
            isUnilateral: name.includes('dumbbell') || name.includes('single') || name.includes('one arm'),
            instructions: apiEx.instructions || [],
            overview: apiEx.overview || '',
            tips: apiEx.exerciseTips || [],
            variations: apiEx.variations || [],
            equipment: equipment,
            secondaryMuscles: apiEx.secondaryMuscles || []
        };
    } catch (error) {
        console.error("[ExerciseService] Mapping Error", error);
        return {
            id: apiEx.exerciseId || crypto.randomUUID(),
            name: apiEx.name || 'Unknown',
            targetMuscle: 'cardio',
            gifUrl: '',
            fatigueFactor: 1,
            isUnilateral: false
        };
    }
};

export interface PaginatedResult {
    data: Exercise[];
    nextCursor: string | null;
}

/**
 * UNIFIED FETCHER
 * Handles Search, Filtering, and Pagination.
 */
export const getExercises = async (
    options: {
        search?: string;
        muscle?: string;
        cursor?: string;
    }
): Promise<PaginatedResult> => {
    const { search, muscle, cursor } = options;

    // Build Query Params
    const params: Record<string, string | number> = {
        limit: BATCH_SIZE,
    };

    if (cursor) {
        params.after = cursor;
    }

    if (search && search.trim().length > 0) {
        params.name = search.trim();
    }

    if (muscle && muscle !== 'all') {
        const bodyParts = getApiBodyParts(muscle);
        if (bodyParts) {
            params.bodyParts = bodyParts;
        }
    }

    // --- CACHING STRATEGY (CRITICAL FOR RATE LIMITS) ---
    // Generate a unique key for this specific request combination.
    // If the user comes back to "Chest" -> "Page 1" tomorrow, we verify cache.
    const cacheKey = `req_v2_${JSON.stringify(params)}`;
    const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 Hours

    try {
        // Single Page Fetch with Cache
        const response = await NetworkClient.get<ApiResponse>(
            `${API_BASE_URL}/exercises`,
            { params },
            cacheKey,
            CACHE_TTL
        );

        const items = Array.isArray(response.data) ? response.data : [];

        return {
            data: items.map(mapApiToModel),
            nextCursor: response.meta?.nextCursor || null
        };

    } catch (error: unknown) {
        console.warn("Fetch failed, possibly rate limited or offline.", error);

        // Graceful degradation: Return empty instead of crashing UI
        return { data: [], nextCursor: null };
    }
};

/**
 * Get Single Exercise
 */
export const getExerciseById = async (id: string): Promise<Exercise | null> => {
    const local = FALLBACK_EXERCISES.find(e => e.id === id);
    if (local) return local;

    const cacheKey = `ex_detail_${id}`;

    try {
        const response = await NetworkClient.get<ApiResponse>(
            `${API_BASE_URL}/exercises/${id}`,
            {},
            cacheKey,
            1000 * 60 * 60 * 24 * 7 // 7 Days Cache for details
        );

        if (response && response.data && !Array.isArray(response.data)) {
            return mapApiToModel(response.data);
        }
        return null;
    } catch (error) {
        return null;
    }
};

// --- LEGACY WRAPPERS ---
export const fetchExercises = async (cursor?: string): Promise<PaginatedResult> => {
    return getExercises({ cursor });
};
export const searchExercises = async (query: string): Promise<Exercise[]> => {
    const result = await getExercises({ search: query });
    return result.data;
};
export const getExercisesByMuscle = async (muscle: string, cursor?: string): Promise<PaginatedResult> => {
    return getExercises({ muscle, cursor });
};
