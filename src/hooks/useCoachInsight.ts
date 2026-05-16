import { useMemo } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { getOverreachWarning } from '../engine/periodization';
import { getExerciseProgressStatus } from '../utils/engine';
import { Session, WorkoutSet } from '../types';

export interface CoachInsight {
  id: string;
  type: 'warning' | 'achievement' | 'suggestion' | 'tip';
  title: string;
  body: string;
  icon: 'AlertTriangle' | 'Trophy' | 'TrendingUp' | 'Info';
  priority: number;
}

export const useCoachInsight = (session?: Session) => {
    const { history, exercises } = useWorkoutStore();

    return useMemo(() => {
        const insights: CoachInsight[] = [];

        // 1. Check for MRV Overreach
        const warnings = getOverreachWarning(history, exercises);
        warnings.forEach(w => {
            insights.push({
                id: `warning-${w.muscle}`,
                type: w.severity === 'critical' ? 'warning' : 'suggestion',
                title: w.severity === 'critical' ? 'Overtraining Risco Alto' : 'Atenção ao Volume',
                body: w.recommendation,
                icon: 'AlertTriangle',
                priority: w.severity === 'critical' ? 1 : 2
            });
        });

        // 2. Check for PRs in the provided session
        if (session) {
            let prCount = 0;
            const uniqueExercises = Array.from(new Set(session.sets.map(s => s.exerciseId)));
            
            uniqueExercises.forEach(exId => {
                const exSets = session.sets.filter(s => s.exerciseId === exId && s.isCompleted);
                if (exSets.length === 0) return;
                
                const bestE1rmThisSession = Math.max(...exSets.map(s => s.estimated1RM || 0));
                
                // Get historical best BEFORE this session
                const historicalSets: WorkoutSet[] = [];
                history.filter(s => s.date < session.date).forEach(s => {
                    historicalSets.push(...s.sets.filter(set => set.exerciseId === exId && set.isCompleted));
                });
                
                const bestHistoricalE1rm = historicalSets.length > 0 ? Math.max(...historicalSets.map(s => s.estimated1RM || 0)) : 0;
                
                if (bestHistoricalE1rm > 0 && bestE1rmThisSession > bestHistoricalE1rm * 1.02) {
                    prCount++;
                }
            });

            if (prCount > 0) {
                insights.push({
                    id: 'pr-achievement',
                    type: 'achievement',
                    title: 'Novo Patamar de Força',
                    body: `Você bateu PR (Personal Record) em ${prCount} exercícios neste treino! Excelente trabalho de progressão.`,
                    icon: 'Trophy',
                    priority: 2
                });
            }

            // 3. Check for specific stalls
            if (uniqueExercises.length > 0 && prCount === 0) {
                const exId = uniqueExercises[0];
                const status = getExerciseProgressStatus(history.filter(s => s.date <= session.date), exId);
                if (status.status === 'stalled') {
                    insights.push({
                        id: 'stall-warning',
                        type: 'suggestion',
                        title: 'Alerta de Platô',
                        body: status.message,
                        icon: 'TrendingUp',
                        priority: 3
                    });
                }
            }
        }

        // Sort by priority (lower number = higher priority)
        return insights.sort((a, b) => a.priority - b.priority);
    }, [history, exercises, session]);
};
