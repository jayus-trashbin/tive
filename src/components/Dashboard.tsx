import React, { useMemo } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { logger } from '../utils/logger';
import { calculateCurrentStreak, getWeeklyStats, calculateACWR } from '../utils/engine';
import { usePhysiology } from '../hooks/usePhysiology';
import { MuscleGroup, Routine } from '../types';
import {
    DashboardHeader,
    MetricStrip,
    StreakCard,
    NextMission,
    MuscleReadiness
} from './dashboard/index';
import ACWRCard from './analytics/ACWRCard';

/**
 * Dashboard — Premium Home Screen
 * 
 * Visual hierarchy (Modularized):
 *   1. DashboardHeader (Greeting + Profile)
 *   2. MetricStrip (Streak + Volume + Sessions)
 *   3. NextMission (Hero Action Card)
 *   4. MuscleReadiness (Fatigue / Recovery)
 */
const Dashboard: React.FC = () => {
    const history = useWorkoutStore(s => s.history);
    const userStats = useWorkoutStore(s => s.userStats);
    const routines = useWorkoutStore(s => s.routines);
    const startSession = useWorkoutStore(s => s.startSession);
    const { calculateReadiness } = usePhysiology();

    // --- CALCULATIONS ---
    const streak = useMemo(() => {
        try { return calculateCurrentStreak(history); }
        catch (e) { logger.warn('Dashboard', 'Streak calculation failed', e); return 0; }
    }, [history]);

    const weeklyStats = useMemo(() => {
        try { return getWeeklyStats(history); }
        catch (e) { logger.warn('Dashboard', 'Weekly stats calculation failed', e); return { count: 0, volume: 0 }; }
    }, [history]);

    const formattedVolume = useMemo(() => {
        const vol = weeklyStats.volume || 0;
        if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
        return vol.toString();
    }, [weeklyStats.volume]);

    const nextRoutine = useMemo((): Routine | null => {
        try {
            if (routines.length === 0) return null;
            if (history.length === 0) return routines[0];

            // history is newest first. Find the most recent session from a routine.
            const lastRoutineSession = history.find(s => 
                s.routineId ? routines.some(r => r.id === s.routineId) : routines.some(r => r.name === s.name)
            );

            if (!lastRoutineSession) return routines[0];

            const lastIndex = routines.findIndex(r => 
                (lastRoutineSession.routineId && r.id === lastRoutineSession.routineId) || 
                r.name === lastRoutineSession.name
            );

            if (lastIndex === -1 || lastIndex === routines.length - 1) return routines[0];
            return routines[lastIndex + 1];
        } catch (e) { logger.warn('Dashboard', 'Next routine logic failed', e); return routines[0] || null; }
    }, [routines, history]);

    const readinessData = useMemo(() => {
        try {
            const muscles: MuscleGroup[] = ['chest', 'back', 'upper legs', 'lower legs', 'shoulders', 'arms'];
            return muscles.map(m => {
                const { score, label } = calculateReadiness(m);
                return { muscle: m, score, label };
            }).sort((a, b) => a.score - b.score);
        } catch (e) { logger.warn('Dashboard', 'Readiness calculation failed', e); return []; }
    }, [calculateReadiness]);

    const acwr = useMemo(() => {
        try { return calculateACWR(history); }
        catch (e) { return null; }
    }, [history]);

    return (
        <div
            className="flex flex-col h-full overflow-y-auto px-5 pb-32 space-y-8 no-scrollbar scroll-smooth"
            style={{ paddingTop: 'calc(var(--sat) + 1.5rem)' }}
        >
            <DashboardHeader />

            <MetricStrip 
                sessionCount={weeklyStats.count} 
                formattedVolume={formattedVolume}
                streakCard={<StreakCard streak={streak} history={history} />}
            />

            <NextMission nextRoutine={nextRoutine} onStart={startSession} />

            <MuscleReadiness readiness={readinessData} />

            {/* A-02: ACWR Card */}
            {acwr && history.length >= 4 && (
                <section>
                    <ACWRCard
                        ratio={acwr.ratio}
                        acute={acwr.acute}
                        chronic={acwr.chronic}
                        risk={acwr.risk}
                    />
                </section>
            )}
        </div>
    );
};

export default Dashboard;

