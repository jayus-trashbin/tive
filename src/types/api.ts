
// OSS ExerciseDB API — oss.exercisedb.dev/api/v1
// Dataset: exerciseId, name, gifUrl, bodyParts[], targetMuscles[], equipments[], secondaryMuscles[], instructions[]
export interface ApiExercise {
  exerciseId: string;
  name: string;
  gifUrl: string;                  // Always present: https://static.exercisedb.dev/media/{exerciseId}.gif
  bodyParts: string[];             // lowercase: "chest", "back", "upper legs", "lower legs", "shoulders", "upper arms", "lower arms", "waist", "cardio", "neck"
  targetMuscles: string[];         // anatomical: "pectorals", "spine", "quadriceps", "hamstrings", etc.
  equipments: string[];            // lowercase: "barbell", "dumbbell", "body weight", "cable", "leverage machine", etc.
  secondaryMuscles: string[];
  instructions?: string[];
  // V2-compat fields — may appear in locally cached data from old API, kept for safe deserialization
  imageUrl?: string;
  imageUrls?: Record<string, string>;
  videoUrl?: string;
  exerciseTips?: string[];
  overview?: string;
  variations?: string[];
  exerciseType?: string;
  keywords?: string[];
}

export interface ApiResponse {
  success: boolean;
  data: ApiExercise[] | ApiExercise;
  meta?: {
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
  };
}
