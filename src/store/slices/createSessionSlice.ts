import { StateCreator } from 'zustand';
import { WorkoutState, SessionSlice } from '../../types/store';
import { Session, WorkoutSet, PhysiologyState, MuscleGroup, RoutineBlock, Routine, Exercise } from '../../types';
import { syncService } from '../../services/SyncService';
import { processSessionCompletion, getPreviousSetPerformance, getSuggestedWeight } from '../../utils/engine';

// Initial state helpers
const initialPhysiology: PhysiologyState = {
    muscleFatigue: {
        chest: 0, back: 0, 'upper legs': 0, 'lower legs': 0, shoulders: 0, arms: 0, core: 0, cardio: 0
    },
    lastUpdate: Date.now()
};

export const createSessionSlice: StateCreator<WorkoutState, [], [], SessionSlice> = (set, get) => ({
    history: [],
    activeSession: null,
    restTimer: { endTime: null, originalDuration: 0, isRunning: false },

    userStats: {
        name: '',
        email: '',
        isOnboarded: false,
        bodyweight: 80,
        gender: 'male',
        wilksScore: 0,
        supabaseUrl: '',
        supabaseKey: '',
        unitSystem: 'metric',
        theme: 'dark'
    },
    physiology: initialPhysiology,

    updateUserStats: (newStats) => set((state) => ({
        userStats: { ...state.userStats, ...newStats }
    })),

    startSession: (routineId?: string) => {
        try {
            const { routines, history } = get();

            let sessionName = `Workout #${history.length + 1}`;
            let plannedExerciseIds: string[] = [];
            let initialSets: WorkoutSet[] = [];
            let routineSnapshot: RoutineBlock[] = [];

            if (routineId) {
                const routine = routines.find(r => r.id === routineId);
                if (routine) {
                    sessionName = routine.name;
                    plannedExerciseIds = routine.exerciseIds || [];
                    routineSnapshot = routine.blocks || [];

                    // --- INTELLIGENT PRE-POPULATION ---
                    const getDefaults = (exerciseId: string, setIndex: number, plannedWeight: number, plannedReps: number, plannedRpe: number) => {
                        let w = plannedWeight || 0;
                        let r = plannedReps || 0;
                        let rpe = plannedRpe || 8;
                        if (w === 0 || r === 0) {
                            const lastPerf = getPreviousSetPerformance(get().history, routineId, exerciseId, setIndex);
                            if (lastPerf) {
                                if (w === 0) w = getSuggestedWeight(lastPerf) || lastPerf.weight;
                                if (r === 0) r = lastPerf.reps;
                            }
                        }
                        return { w, r, rpe };
                    };

                    if (routine.blocks && routine.blocks.length > 0) {
                        // Modern Routine: Follow the blocks
                        routine.blocks.forEach(block => {
                            block.sets.forEach((plannedSet, setIdx) => {
                                // Parse target reps
                                let initialReps = 0;
                                const parsedReps = parseInt(plannedSet.targetReps);
                                if (!isNaN(parsedReps)) initialReps = parsedReps;

                                const defs = getDefaults(block.exerciseId, setIdx, plannedSet.targetWeight || 0, initialReps, plannedSet.targetRpe || 8);

                                initialSets.push({
                                    id: crypto.randomUUID(),
                                    exerciseId: block.exerciseId,
                                    weight: defs.w,
                                    reps: defs.r,
                                    rpe: defs.rpe,
                                    type: plannedSet.type || 'working',
                                    timestamp: Date.now(),
                                    estimated1RM: 0,
                                    isCompleted: false
                                });
                            });
                        });
                    } else {
                        // Legacy Routine: Default to 3 sets
                        routine.exerciseIds.forEach(eid => {
                            for (let i = 0; i < 3; i++) {
                                const defs = getDefaults(eid, i, 0, 0, 8);
                                initialSets.push({
                                    id: crypto.randomUUID(),
                                    exerciseId: eid,
                                    weight: defs.w,
                                    reps: defs.r,
                                    rpe: defs.rpe,
                                    type: 'working',
                                    timestamp: Date.now(),
                                    estimated1RM: 0,
                                    isCompleted: false
                                });
                            }
                        });
                    }
                }
            }

            const newSession: Session = {
                id: crypto.randomUUID(),
                date: Date.now(),
                name: sessionName,
                routineId,
                sets: initialSets, // Now populated with targets
                isCompleted: false,
                volumeLoad: 0,
                plannedExerciseIds,
                routineSnapshot,
                _synced: false,
                updatedAt: Date.now()
            };
            set({ activeSession: newSession, isMinimized: false, restTimer: { endTime: null, originalDuration: 0, isRunning: false } });
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
        } catch (error) {
            console.error("[Store] startSession failed:", error);
            get().addNotification("Failed to start session. Please try again.", "error");
        }
    },

    finishSession: () => {
        try {
            const { activeSession, history, exercises, physiology } = get();
            if (!activeSession) return;

            const {
                completedSession,
                updatedExercises,
                updatedPhysiology
            } = processSessionCompletion(activeSession, exercises, physiology, history);

            set({
                history: [completedSession, ...history],
                activeSession: null,
                exercises: updatedExercises,
                physiology: updatedPhysiology,
                restTimer: { endTime: null, originalDuration: 0, isRunning: false },
                isMinimized: false
            });

            // Trigger sync in background
            if (typeof window !== 'undefined') {
                if ('requestIdleCallback' in window) {
                    window.requestIdleCallback(() => syncService.sync());
                } else {
                    setTimeout(() => syncService.sync(), 0);
                }
            }
        } catch (error) {
            console.error("[Store] finishSession CRITICAL FAILURE:", error);
            get().addNotification("Error saving workout. Your data is still safe in the active session.", "error");
        }
    },

    startRest: (seconds) => {
        set({
            restTimer: {
                endTime: Date.now() + (seconds * 1000),
                originalDuration: seconds,
                isRunning: true
            }
        });
    },

    skipRest: () => set({ restTimer: { endTime: null, originalDuration: 0, isRunning: false } }),

    addRestTime: (seconds) => set((state) => {
        if (!state.restTimer.endTime) return {};
        return {
            restTimer: {
                ...state.restTimer,
                endTime: state.restTimer.endTime + (seconds * 1000),
                originalDuration: state.restTimer.originalDuration + seconds
            }
        };
    }),

    logSet: (newSet: WorkoutSet) => {
        const { activeSession } = get();
        if (activeSession) {
            set({
                activeSession: {
                    ...activeSession,
                    sets: [...activeSession.sets, { ...newSet, isCompleted: false }],
                },
            });
        }
    },

    addWarmupSets: (exerciseId: string, warmups: WorkoutSet[]) => {
        const { activeSession } = get();
        if (!activeSession) return;

        // Find index of first set of this exercise to insert them before it
        const firstSetIndex = activeSession.sets.findIndex(s => s.exerciseId === exerciseId);
        
        let newSets = [...activeSession.sets];
        if (firstSetIndex !== -1) {
            newSets.splice(firstSetIndex, 0, ...warmups);
        } else {
            newSets = [...newSets, ...warmups];
        }

        set({
            activeSession: {
                ...activeSession,
                sets: newSets
            }
        });
    },

    updateSet: (setId, updates) => {
        const { activeSession } = get();
        if (activeSession) {
            set({
                activeSession: {
                    ...activeSession,
                    sets: activeSession.sets.map(s => s.id === setId ? { ...s, ...updates } : s)
                }
            });
        }
    },

    toggleSetComplete: (setId, isCompleted) => {
        const { activeSession } = get();
        if (!activeSession) return;

        // 1. Update the set status
        set({
            activeSession: {
                ...activeSession,
                sets: activeSession.sets.map(s => s.id === setId ? { ...s, isCompleted } : s)
            }
        });

        // 2. SMART REST LOGIC
        if (isCompleted) {
            try {
                const currentSet = activeSession.sets.find(s => s.id === setId);
                if (!currentSet) return;

                // Find config from routine snapshot
                const blockConfig = activeSession.routineSnapshot?.find(b => b.exerciseId === currentSet.exerciseId);

                // Check if this is the LAST set of this exercise
                const setsOfThisExercise = activeSession.sets.filter(s => s.exerciseId === currentSet.exerciseId);
                const isLastSet = setsOfThisExercise[setsOfThisExercise.length - 1].id === setId;

                // Determine Duration
                let restDuration = 90; // Default

                if (isLastSet) {
                    // Transition Rest
                    restDuration = blockConfig?.transitionSeconds || 180; // Default 3 min between exercises
                } else {
                    // Normal Rest
                    restDuration = blockConfig?.restSeconds || 90; // Default 90s
                }

                // Trigger Timer
                get().startRest(restDuration);
            } catch (err) {
                console.warn("[Store] Auto-rest logic failed, ignoring.", err);
            }
        }
    },

    deleteSet: (setId: string) => {
        const { activeSession } = get();
        if (activeSession) {
            set({
                activeSession: {
                    ...activeSession,
                    sets: activeSession.sets.filter(s => s.id !== setId),
                },
            });
        }
    },

    updateExerciseNote: (exerciseId: string, note: string) => {
        const { activeSession } = get();
        if (activeSession) {
            set({
                activeSession: {
                    ...activeSession,
                    notes: {
                        ...(activeSession.notes || {}),
                        [exerciseId]: note
                    }
                }
            });
        }
    },

    replaceExercise: (oldExerciseId: string, newExerciseId: string) => {
        const { activeSession } = get();
        if (activeSession) {
            set({
                activeSession: {
                    ...activeSession,
                    sets: activeSession.sets.map(s => 
                        s.exerciseId === oldExerciseId ? { ...s, exerciseId: newExerciseId } : s
                    ),
                    plannedExerciseIds: activeSession.plannedExerciseIds?.map(id => 
                        id === oldExerciseId ? newExerciseId : id
                    ),
                    // Also transfer notes if they exist
                    notes: (() => {
                        const newNotes = { ...(activeSession.notes || {}) };
                        if (newNotes[oldExerciseId]) {
                            newNotes[newExerciseId] = newNotes[oldExerciseId];
                            delete newNotes[oldExerciseId];
                        }
                        return newNotes;
                    })()
                }
            });
        }
    },

    reorderExercises: (oldIndex: number, newIndex: number) => {
        const { activeSession } = get();
        if (activeSession) {
            // Ensure we have a working array of planned IDs
            const currentPlanned = activeSession.plannedExerciseIds || [];
            
            // Collect any freestyle exercises that have sets but aren't in planned
            const loggedIds = Array.from(new Set(activeSession.sets.map(s => s.exerciseId)));
            const freestyle = loggedIds.filter(id => !currentPlanned.includes(id));
            
            // Build the full ordered list as it appears in the UI
            const allExerciseIds = [...currentPlanned, ...freestyle];
            
            // Perform the move
            if (oldIndex >= 0 && oldIndex < allExerciseIds.length && newIndex >= 0 && newIndex < allExerciseIds.length) {
                const itemToMove = allExerciseIds[oldIndex];
                allExerciseIds.splice(oldIndex, 1);
                allExerciseIds.splice(newIndex, 0, itemToMove);
                
                set({
                    activeSession: {
                        ...activeSession,
                        plannedExerciseIds: allExerciseIds // Update store with the new order
                    }
                });
            }
        }
    },

    deleteSession: (sessionId: string) => {
        set((state) => ({
            // Mark as deleted, keep in array for sync, filter out in UI
            history: state.history.map(s =>
                s.id === sessionId
                    ? { ...s, deletedAt: Date.now(), _synced: false, updatedAt: Date.now() }
                    : s
            )
        }));
        syncService.sync();
    },

    resetStorage: () => set({
        history: [],
        activeSession: null,
        routines: [],
        userStats: {
            name: '', email: '', isOnboarded: false, bodyweight: 80, gender: 'male', wilksScore: 0, supabaseUrl: '', supabaseKey: '', unitSystem: 'metric', theme: 'dark'
        },
        physiology: initialPhysiology,
        exercises: []
    }),

    markSessionsSynced: (ids) => set((state) => ({
        history: state.history.map(s => ids.includes(s.id) ? { ...s, _synced: true } : s)
    })),

    mergeRemoteData: (remoteSessions, remoteRoutines, remoteExercises) => set((state) => {
        try {
            // Helper: Merge map with conflict resolution
            const mergeEntities = <T extends { id: string, updatedAt?: number, _synced?: boolean }>(
                localItems: T[],
                remoteItems: T[]
            ): T[] => {
                const map = new Map<string, T>();

                // 1. Load Local
                localItems.forEach(item => map.set(item.id, item));

                // 2. Merge Remote
                remoteItems.forEach(remote => {
                    const local = map.get(remote.id);

                    if (!local) {
                        // New from remote
                        map.set(remote.id, { ...remote, _synced: true });
                    } else {
                        // Conflict! Check timestamps
                        const localTime = local.updatedAt || 0;
                        const remoteTime = remote.updatedAt || 0;

                        // If remote is newer (or equal), take remote. 
                        // BUT if local is unsynced and arguably newer (even if clock drift), keep local? 
                        // Strict logic: If local is _synced=false, it means we have pending changes.
                        // Standard "Last Write Wins":
                        if (remoteTime > localTime) {
                            map.set(remote.id, { ...remote, _synced: true });
                        } else {
                            // Keep local, but if timestamps are identical, assume synced
                            if (remoteTime === localTime) {
                                map.set(local.id, { ...local, _synced: true });
                            }
                        }
                    }
                });

                return Array.from(map.values());
            };

            const mergedHistory = mergeEntities<Session>(state.history, remoteSessions)
                .sort((a, b) => b.date - a.date);

            const mergedRoutines = mergeEntities<Routine>(state.routines, remoteRoutines);

            // Exercises merging (simpler, usually append-only or simple updates)
            const mergedExercises = mergeEntities<Exercise>(state.exercises, remoteExercises);

            return {
                history: mergedHistory,
                routines: mergedRoutines,
                exercises: mergedExercises
            };
        } catch (e) {
            console.error("[Store] mergeRemoteData failed:", e);
            return {};
        }
    })
});
