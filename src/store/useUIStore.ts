import { create } from 'zustand';

export interface UIState {
  isMinimized: boolean;
  isRoutineEditorOpen: boolean;
  isRoutinePreviewOpen: boolean;
  isProfileOpen: boolean;
  _hasHydrated: boolean;
  isSyncing: boolean;
  lastSyncError: string | null;

  notifications: { id: string, message: string, type: 'info' | 'success' | 'error' }[];

  setSyncing: (isSyncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  addNotification: (message: string, type: 'info' | 'success' | 'error') => void;
  removeNotification: (id: string) => void;

  toggleMinimize: (minimized?: boolean) => void;
  setProfileOpen: (isOpen: boolean) => void;
  setRoutineEditorOpen: (isOpen: boolean) => void;
  setRoutinePreviewOpen: (isOpen: boolean) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isMinimized: false,
  isRoutineEditorOpen: false,
  isRoutinePreviewOpen: false,
  isProfileOpen: false,
  _hasHydrated: false,
  isSyncing: false,
  lastSyncError: null,

  notifications: [],

  setSyncing: (isSyncing) => set({ isSyncing }),
  setSyncError: (lastSyncError) => set({ lastSyncError }),

  addNotification: (message, type) => {
    const id = crypto.randomUUID();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));

    // Auto dismiss
    setTimeout(() => {
      get().removeNotification(id);
    }, 3000);
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
  setHasHydrated: (state) => set({ _hasHydrated: state })
}));
