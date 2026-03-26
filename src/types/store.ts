import { Session, Exercise, Routine, UserStats, MuscleGroup, WorkoutSet } from './domain';
import { PhotoSlice } from './photo';

export interface PhysiologyState {
  muscleFatigue: Record<MuscleGroup, number>;
  lastUpdate: number;
}

export interface RestTimerState {
  endTime: number | null;
  originalDuration: number;
  isRunning: boolean;
}

// --- SLICES ---

export interface SessionSlice {
  history: Session[];
  activeSession: Session | null;
  physiology: PhysiologyState;
  userStats: UserStats;
  restTimer: RestTimerState;

  // Actions
  startSession: (routineId?: string) => void;
  finishSession: () => void;
  deleteSession: (sessionId: string) => void;

  logSet: (set: WorkoutSet) => void;
  addWarmupSets: (exerciseId: string, warmups: WorkoutSet[]) => void;
  updateSet: (setId: string, updates: Partial<WorkoutSet>) => void;
  toggleSetComplete: (setId: string, isCompleted: boolean) => void;
  deleteSet: (setId: string) => void;
  replaceExercise: (oldExerciseId: string, newExerciseId: string) => void;
  reorderExercises: (oldIndex: number, newIndex: number) => void;
  updateExerciseNote: (exerciseId: string, note: string) => void;

  startRest: (seconds: number) => void;
  skipRest: () => void;
  addRestTime: (seconds: number) => void;

  updateUserStats: (stats: Partial<UserStats>) => void;
  resetStorage: () => void;

  markSessionsSynced: (ids: string[]) => void;
  mergeRemoteData: (sessions: Session[], routines: Routine[], exercises: Exercise[]) => void;
}

export interface ExerciseSlice {
  exercises: Exercise[];

  setExercises: (exercises: Exercise[]) => void;
  mergeExercises: (exercises: Exercise[]) => void;
  addExercise: (exercise: Exercise) => void;
}

export interface RoutineSlice {
  routines: Routine[];

  saveRoutine: (routine: Routine) => void;
  deleteRoutine: (id: string) => void;
  deleteRoutines: (ids: string[]) => void;
  markRoutinesSynced: (ids: string[]) => void;
}

export interface UISlice {
  isMinimized: boolean;
  isRoutineEditorOpen: boolean;
  isRoutinePreviewOpen: boolean;
  isProfileOpen: boolean;
  _hasHydrated: boolean;
  isSyncing?: boolean;
  lastSyncError?: string | null;

  setSyncing?: (isSyncing: boolean) => void;
  setSyncError?: (error: string | null) => void;

  notifications: { id: string, message: string, type: 'info' | 'success' | 'error' }[];
  addNotification: (message: string, type: 'info' | 'success' | 'error') => void;
  removeNotification: (id: string) => void;

  toggleMinimize: (minimized?: boolean) => void;
  setProfileOpen: (isOpen: boolean) => void;
  setRoutineEditorOpen: (isOpen: boolean) => void;
  setRoutinePreviewOpen: (isOpen: boolean) => void;
  setHasHydrated: (state: boolean) => void;
}

// --- Combined Store Type ---
export type WorkoutState = SessionSlice & ExerciseSlice & RoutineSlice & UISlice & PhotoSlice;

