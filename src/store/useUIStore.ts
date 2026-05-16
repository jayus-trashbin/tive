import { create } from 'zustand';

export interface UIState {
  isMinimized: boolean;
  isRoutineEditorOpen: boolean;
  isRoutinePreviewOpen: boolean;
  isSettingsOpen: boolean;
  _hasHydrated: boolean;
  isSyncing: boolean;
  lastSyncError: string | null;
  /** Weight (kg) the user is currently editing/focused. PlateCalculator reads this. */
  plateTargetWeight: number;

  notifications: { id: string, message: string, type: 'info' | 'success' | 'error' }[];

  setSyncing: (isSyncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  addNotification: (message: string, type: 'info' | 'success' | 'error') => void;
  removeNotification: (id: string) => void;

  toggleMinimize: (minimized?: boolean) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  setRoutineEditorOpen: (isOpen: boolean) => void;
  setRoutinePreviewOpen: (isOpen: boolean) => void;
  setHasHydrated: (state: boolean) => void;
  setPlateTargetWeight: (kg: number) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isMinimized: false,
  isRoutineEditorOpen: false,
  isRoutinePreviewOpen: false,
  isSettingsOpen: false,
  _hasHydrated: false,
  isSyncing: false,
  lastSyncError: null,
  plateTargetWeight: 0,

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

  setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  setRoutineEditorOpen: (isOpen) => set({ isRoutineEditorOpen: isOpen }),
  setRoutinePreviewOpen: (isOpen) => set({ isRoutinePreviewOpen: isOpen }),
  setHasHydrated: (state) => set({ _hasHydrated: state }),
  setPlateTargetWeight: (kg) => set({ plateTargetWeight: kg }),
}));
