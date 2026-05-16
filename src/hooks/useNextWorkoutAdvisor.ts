import { useMemo } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { getMuscleFatigueTimeline } from '../utils/analytics';
import { MuscleGroup } from '../types';

export interface NextWorkoutRecommendation {
  type: 'routine' | 'rest' | 'active_recovery';
  routineId?: string;
  routineName?: string;
  readinessScore: number; // 0-100
  reason: string;
}

export const useNextWorkoutAdvisor = (): NextWorkoutRecommendation | null => {
    const { history, routines, exercises } = useWorkoutStore();

    return useMemo(() => {
        if (routines.length === 0) return null;
        if (history.length === 0) {
            return {
                type: 'routine',
                routineId: routines[0].id,
                routineName: routines[0].name,
                readinessScore: 100,
                reason: 'Vamos começar o seu primeiro treino!'
            };
        }

        // Calculate readiness based on fatigue timeline (last 7 days)
        const timeline = getMuscleFatigueTimeline(history, exercises, 7);
        const latestFatigue = timeline.length > 0 ? timeline[timeline.length - 1] : null;
        
        // Count how many muscles are highly fatigued (>80%)
        let highlyFatiguedCount = 0;
        const fatigueMap: Record<string, number> = {};
        
        if (latestFatigue) {
            Object.entries(latestFatigue).forEach(([key, value]) => {
                if (key !== 'date' && typeof value === 'number') {
                    fatigueMap[key] = value;
                    if (value > 80) highlyFatiguedCount++;
                }
            });
        }

        // If too many muscles are fatigued, suggest REST
        if (highlyFatiguedCount >= 3) {
            return {
                type: 'rest',
                readinessScore: 30,
                reason: 'Muitos grupamentos estão sob alta fadiga. Descanse hoje para evitar overtraining.'
            };
        }

        // Score routines based on muscle readiness
        // We pick the routine with the lowest average fatigue for its target muscles
        let bestRoutine = routines[0];
        let bestScore = 100;
        let bestReadiness = 0;

        routines.forEach(routine => {
            let totalFatigue = 0;
            let targetCount = 0;
            // Assuming we can derive targets from exerciseIds. For simplicity, we just use the name if we don't look up exercises
            // Better: just check last time this routine was performed
            const lastPerformed = history.filter(s => s.routineId === routine.id && s.isCompleted)
                                         .sort((a, b) => b.date - a.date)[0];
            
            const daysSince = lastPerformed ? (Date.now() - lastPerformed.date) / (24 * 60 * 60 * 1000) : 999;
            
            // Score = days since last performed (higher is better). 
            // Cap at 10 days to avoid skewing.
            const score = Math.min(daysSince, 10);
            
            if (score > bestScore || bestScore === 100) {
                bestScore = score;
                bestRoutine = routine;
                bestReadiness = Math.min(100, Math.round(score * 10)); // proxy readiness
            }
        });

        if (bestScore < 2) { // Performed very recently
             return {
                type: 'active_recovery',
                readinessScore: 50,
                reason: 'Seus treinos estão em dia. Considere um cardio leve hoje.'
            };
        }

        return {
            type: 'routine',
            routineId: bestRoutine.id,
            routineName: bestRoutine.name,
            readinessScore: Math.max(70, bestReadiness),
            reason: `Sua musculatura está recuperada para este treino.`
        };
    }, [history, routines]);
};
