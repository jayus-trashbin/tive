
export interface ApiExercise {
  exerciseId: string;
  name: string;
  imageUrl?: string; // New field for V1
  imageUrls?: Record<string, string>; // Available in details
  gifUrl?: string; // Legacy/Fallback
  videoUrl?: string; // Sometimes used for demos
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions?: string[];
  exerciseTips?: string[]; // New
  overview?: string; // New
  variations?: string[]; // New
  exerciseType?: string;
  keywords?: string[];
}

export interface ApiResponse {
  success: boolean;
  data: ApiExercise[] | ApiExercise;
  meta?: {
    total: number;
    hasNextPage: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
  };
}
