import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../utils/storage';

export type MesocycleFocus = 'hypertrophy' | 'strength' | 'power';

export interface MesocycleDay {
  dayIndex: number; // 0=Mon … 6=Sun
  routineId: string | null;
  label: string; // User-facing day name
}

export interface MesocycleWeek {
  weekNumber: number; // 1-based
  isDeload: boolean;
  days: MesocycleDay[];
}

export interface MesocyclePlan {
  id: string;
  name: string;
  totalWeeks: number; // 4-6
  startDate: number;
  focus: MesocycleFocus;
  weeks: MesocycleWeek[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildWeeks(totalWeeks: number): MesocycleWeek[] {
  return Array.from({ length: totalWeeks }, (_, i) => ({
    weekNumber: i + 1,
    isDeload: i + 1 === totalWeeks, // last week is always deload
    days: Array.from({ length: 7 }, (_, d) => ({
      dayIndex: d,
      routineId: null,
      label: DAY_LABELS[d],
    })),
  }));
}

interface MesocycleStore {
  activePlan: MesocyclePlan | null;
  plans: MesocyclePlan[];

  createPlan: (name: string, totalWeeks: number, focus: MesocycleFocus) => void;
  updatePlan: (plan: MesocyclePlan) => void;
  deletePlan: (id: string) => void;
  setActivePlan: (id: string) => void;

  assignRoutine: (planId: string, weekNumber: number, dayIndex: number, routineId: string | null) => void;
  toggleDeload: (planId: string, weekNumber: number) => void;
}

export const useMesocycleStore = create<MesocycleStore>()(
  persist(
    (set, get) => ({
      activePlan: null,
      plans: [],

      createPlan: (name, totalWeeks, focus) => {
        const plan: MesocyclePlan = {
          id: crypto.randomUUID(),
          name,
          totalWeeks,
          focus,
          startDate: Date.now(),
          weeks: buildWeeks(totalWeeks),
        };
        set(state => ({
          plans: [...state.plans, plan],
          activePlan: plan,
        }));
      },

      updatePlan: (plan) => {
        set(state => ({
          plans: state.plans.map(p => p.id === plan.id ? plan : p),
          activePlan: state.activePlan?.id === plan.id ? plan : state.activePlan,
        }));
      },

      deletePlan: (id) => {
        set(state => ({
          plans: state.plans.filter(p => p.id !== id),
          activePlan: state.activePlan?.id === id ? null : state.activePlan,
        }));
      },

      setActivePlan: (id) => {
        const plan = get().plans.find(p => p.id === id) ?? null;
        set({ activePlan: plan });
      },

      assignRoutine: (planId, weekNumber, dayIndex, routineId) => {
        set(state => {
          const plans = state.plans.map(p => {
            if (p.id !== planId) return p;
            return {
              ...p,
              weeks: p.weeks.map(w => {
                if (w.weekNumber !== weekNumber) return w;
                return {
                  ...w,
                  days: w.days.map(d =>
                    d.dayIndex === dayIndex ? { ...d, routineId } : d
                  ),
                };
              }),
            };
          });
          const activePlan = state.activePlan?.id === planId
            ? plans.find(p => p.id === planId) ?? state.activePlan
            : state.activePlan;
          return { plans, activePlan };
        });
      },

      toggleDeload: (planId, weekNumber) => {
        set(state => {
          const plans = state.plans.map(p => {
            if (p.id !== planId) return p;
            return {
              ...p,
              weeks: p.weeks.map(w =>
                w.weekNumber === weekNumber ? { ...w, isDeload: !w.isDeload } : w
              ),
            };
          });
          const activePlan = state.activePlan?.id === planId
            ? plans.find(p => p.id === planId) ?? state.activePlan
            : state.activePlan;
          return { plans, activePlan };
        });
      },
    }),
    {
      name: 'tive-mesocycle-store',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
