
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'upper legs'
  | 'lower legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio';

export type Gender = 'male' | 'female';

export interface UserStats {
  // Identity
  name?: string;
  email?: string;
  isOnboarded?: boolean;

  // Physical
  bodyweight: number; // kg
  height?: number;    // cm
  gender: Gender;
  wilksScore: number;

  // Integrations
  supabaseUrl?: string;
  supabaseKey?: string;
  geminiApiKey?: string; // AI
  lastSyncTime?: number;
  unitSystem: 'metric' | 'imperial';
  theme: 'dark' | 'light' | 'oled';
}

export interface ProfileFormData {
  name: string;
  email: string;
  bodyweight: number;
  gender: Gender;
  supabaseUrl: string;
  supabaseKey: string;
  unitSystem: 'metric' | 'imperial';
  theme: 'dark' | 'light' | 'oled';
  geminiApiKey: string;
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: MuscleGroup;
  gifUrl: string; // The Animation (Legacy GIF)
  staticImageUrl?: string; // The Static Preview (Light)
  videoUrl?: string; // The Animation (Modern MP4)
  fatigueFactor: number;
  isUnilateral: boolean;

  // Extended Details
  instructions?: string[];
  secondaryMuscles?: string[];
  equipment?: string;
  overview?: string; // New: General description
  tips?: string[];   // New: Pro tips
  variations?: string[]; // New: Variations list

  personalRecord?: number;
  lastPerformed?: number;

  // Sync
  updatedAt?: number;
  deletedAt?: number; // Soft Delete
}

// --- NEW ROUTINE ARCHITECTURE ---
export type SetType = 'warmup' | 'working' | 'failure' | 'drop';

export interface RoutineSet {
  id: string;
  type: SetType;
  targetReps: string; // "8-12", "5", "AMRAP"
  targetWeight?: number; // Optional
  targetRpe?: number;
}

export interface RoutineBlock {
  id: string;
  exerciseId: string;
  sets: RoutineSet[];
  isSuperset: boolean; // If true, visually link with PREVIOUS block
  notes?: string;
  restSeconds?: number; // Rest BETWEEN sets
  transitionSeconds?: number; // Rest AFTER the last set of this block
}

export interface Routine {
  id: string;
  name: string;
  exerciseIds: string[]; // KEEP for backward compatibility
  blocks?: RoutineBlock[]; // NEW: Detailed Structure
  lastPerformed?: number;

  // Sync
  updatedAt?: number;
  deletedAt?: number; // Soft Delete
  _synced?: boolean;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  weight: number;
  reps: number;
  rpe: number; // 1-10
  timestamp: number;
  estimated1RM: number;
  type?: SetType; // Added for Hevy-like enrichment
  tempo?: string;
  targetRpe?: number;
  isPR?: boolean;
  isCompleted?: boolean;
}

export interface Session {
  id: string;
  date: number;
  name: string;
  sets: WorkoutSet[];
  isCompleted: boolean;
  volumeLoad: number;
  acwr?: number;
  plannedExerciseIds?: string[];
  // Snapshot of routine config to apply rest times correctly during session
  routineSnapshot?: RoutineBlock[];

  // Sync
  updatedAt?: number;
  deletedAt?: number; // Soft Delete
  _synced?: boolean;
}

export interface Mesocycle {
  id: string;
  name: string;
  weeks: number;
  currentWeek: number;
  focus: 'hypertrophy' | 'strength' | 'power';
}
