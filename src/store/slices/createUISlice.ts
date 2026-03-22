import { StateCreator } from 'zustand';
import { WorkoutState, UISlice } from '../../types/store';

export const createUISlice: StateCreator<WorkoutState, [], [], UISlice> = (set, get) => ({
    isMinimized: false,
    isRoutineEditorOpen: false,
    isRoutinePreviewOpen: false,
    isProfileOpen: false,
    _hasHydrated: false,

    notifications: [],
    addNotification: (message, type) => {
        const id = crypto.randomUUID();
        set((state) => ({
            notifications: [...state.notifications, { id, message, type }]
        }));
        // Auto-remove after 5 seconds
        setTimeout(() => get().removeNotification(id), 5000);
    },
    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),

    toggleMinimize: (minimized) => set((state) => ({
        isMinimized: minimized !== undefined ? minimized : !state.isMinimized
    })),
    setProfileOpen: (isOpen) => set({ isProfileOpen: isOpen }),
    setRoutineEditorOpen: (isOpen) => set({ isRoutineEditorOpen: isOpen }),
    setRoutinePreviewOpen: (isOpen) => set({ isRoutinePreviewOpen: isOpen }),
    setHasHydrated: (state) => set({ _hasHydrated: state }),

    // Sync State
    isSyncing: false,
    lastSyncError: null,
    setSyncing: (isSyncing) => set({ isSyncing }),
    setSyncError: (error) => set({ lastSyncError: error }),
});
