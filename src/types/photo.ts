import { MuscleGroup } from './domain';

/**
 * Progress photo stored locally in IndexedDB
 */
export interface ProgressPhoto {
    id: string;
    timestamp: number;
    sessionId?: string;              // Link to workout session (optional)
    muscleGroups: MuscleGroup[];     // Muscles trained in that session
    imageData: string;               // Base64 data URL (with overlay baked in)
    thumbnailData: string;           // Smaller base64 for gallery grid
    metadata: ProgressPhotoMetadata;
}

export interface ProgressPhotoMetadata {
    bodyweight?: number;
    note?: string;
    camera: 'front' | 'back' | 'upload';
}

/**
 * State for the photo slice
 */
export interface PhotoState {
    photos: ProgressPhoto[];
    isLoading: boolean;
    showPostWorkoutPrompt: boolean;
    pendingSessionId: string | null;
    pendingMuscleGroups: MuscleGroup[];
}

/**
 * Actions for the photo slice
 */
export interface PhotoActions {
    addPhoto: (photo: Omit<ProgressPhoto, 'id'>) => Promise<string>;
    deletePhoto: (id: string) => Promise<void>;
    loadPhotos: () => Promise<void>;
    triggerPostWorkoutPrompt: (sessionId: string, muscleGroups: MuscleGroup[]) => void;
    dismissPostWorkoutPrompt: () => void;
}

export type PhotoSlice = PhotoState & PhotoActions;

/**
 * Key for IndexedDB storage
 */
export const PHOTO_STORAGE_KEY = 'tive_progress_photos';
export const PHOTO_DB_NAME = 'tive_photos_db';
export const PHOTO_STORE_NAME = 'photos';
