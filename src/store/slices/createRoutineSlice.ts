import { StateCreator } from 'zustand';
import { WorkoutState, RoutineSlice } from '../../types/store';
import { syncService } from '../../services/SyncService';

export const createRoutineSlice: StateCreator<WorkoutState, [], [], RoutineSlice> = (set) => ({
    routines: [],

    saveRoutine: (routine) => {
        // Ensure atomic update attributes
        const routineWithMeta = {
            ...routine,
            _synced: false,
            updatedAt: Date.now(),
            deletedAt: undefined // Resurrect if previously deleted
        };

        set((state) => {
            const exists = state.routines.find(r => r.id === routine.id);
            if (exists) {
                return { routines: state.routines.map(r => r.id === routine.id ? routineWithMeta : r) };
            }
            return { routines: [...state.routines, routineWithMeta] };
        });

        if (typeof window !== 'undefined') {
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => syncService.sync());
            } else {
                setTimeout(() => syncService.sync(), 0);
            }
        }
    },

    deleteRoutine: (id) => {
        set((state) => ({
            // Soft delete
            routines: state.routines.map(r =>
                r.id === id
                    ? { ...r, deletedAt: Date.now(), _synced: false, updatedAt: Date.now() }
                    : r
            )
        }));
        syncService.sync();
    },

    deleteRoutines: (ids) => {
        set((state) => ({
            routines: state.routines.map(r =>
                ids.includes(r.id)
                    ? { ...r, deletedAt: Date.now(), _synced: false, updatedAt: Date.now() }
                    : r
            )
        }));
        syncService.sync();
    },

    markRoutinesSynced: (ids) => set((state) => ({
        routines: state.routines.map(r => ids.includes(r.id) ? { ...r, _synced: true } : r)
    })),
});
