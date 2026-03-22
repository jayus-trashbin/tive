import { StateCreator } from 'zustand';
import {
    PhotoSlice,
    PhotoState,
    ProgressPhoto,
    PHOTO_DB_NAME,
    PHOTO_STORE_NAME
} from '../../types/photo';
import { MuscleGroup } from '../../types/domain';
import { photoSyncService } from '../../services/PhotoSyncService';

// ============================================
// IndexedDB Helpers
// ============================================

function openPhotoDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(PHOTO_DB_NAME, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(PHOTO_STORE_NAME)) {
                const store = db.createObjectStore(PHOTO_STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

async function savePhotoToDB(photo: ProgressPhoto): Promise<void> {
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(PHOTO_STORE_NAME, 'readwrite');
        const store = tx.objectStore(PHOTO_STORE_NAME);
        const request = store.put(photo);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();

        tx.oncomplete = () => db.close();
    });
}

async function deletePhotoFromDB(id: string): Promise<void> {
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(PHOTO_STORE_NAME, 'readwrite');
        const store = tx.objectStore(PHOTO_STORE_NAME);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();

        tx.oncomplete = () => db.close();
    });
}

async function loadPhotosFromDB(): Promise<ProgressPhoto[]> {
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(PHOTO_STORE_NAME, 'readonly');
        const store = tx.objectStore(PHOTO_STORE_NAME);
        const index = store.index('timestamp');
        const request = index.openCursor(null, 'prev'); // Newest first

        const photos: ProgressPhoto[] = [];

        request.onerror = () => reject(request.error);
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                photos.push(cursor.value);
                cursor.continue();
            } else {
                resolve(photos);
            }
        };

        tx.oncomplete = () => db.close();
    });
}

// ============================================
// Zustand Slice
// ============================================

const initialState: PhotoState = {
    photos: [],
    isLoading: false,
    showPostWorkoutPrompt: false,
    pendingSessionId: null,
    pendingMuscleGroups: [],
};

export const createPhotoSlice: StateCreator<PhotoSlice> = (set, get) => ({
    ...initialState,

    addPhoto: async (photoData) => {
        const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const photo: ProgressPhoto = { ...photoData, id };

        try {
            // Layer 1: Save to IndexedDB (primary, instant)
            await savePhotoToDB(photo);

            // Layer 2: Queue for Supabase backup (background)
            photoSyncService.queueUpload(photo);

            set((state) => ({
                photos: [photo, ...state.photos], // Newest first
                showPostWorkoutPrompt: false,
                pendingSessionId: null,
                pendingMuscleGroups: [],
            }));

            return id;
        } catch (error) {
            console.error('[PhotoSlice] Failed to save photo:', error);
            throw error;
        }
    },

    deletePhoto: async (id) => {
        try {
            // Layer 1: Delete from IndexedDB
            await deletePhotoFromDB(id);

            // Layer 2: Queue cloud deletion (background)
            photoSyncService.queueDelete(id);

            set((state) => ({
                photos: state.photos.filter(p => p.id !== id),
            }));

        } catch (error) {
            console.error('[PhotoSlice] Failed to delete photo:', error);
            throw error;
        }
    },

    loadPhotos: async () => {
        set({ isLoading: true });
        try {
            const photos = await loadPhotosFromDB();
            set({ photos, isLoading: false });

        } catch (error) {
            console.error('[PhotoSlice] Failed to load photos:', error);
            set({ isLoading: false });
        }
    },

    triggerPostWorkoutPrompt: (sessionId, muscleGroups) => {
        set({
            showPostWorkoutPrompt: true,
            pendingSessionId: sessionId,
            pendingMuscleGroups: muscleGroups,
        });
    },

    dismissPostWorkoutPrompt: () => {
        set({
            showPostWorkoutPrompt: false,
            pendingSessionId: null,
            pendingMuscleGroups: [],
        });
    },
});
