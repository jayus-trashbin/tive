import { Session, Mesocycle, MuscleGroup, Exercise } from '../types';
import { VOLUME_LANDMARKS, getVolumeZone } from './volumeLandmarks';

export type MesocyclePhase = 'accumulation' | 'intensification' | 'deload';

/**
 * Detects the current phase of the mesocycle based on the current week.
 */
export const detectCurrentPhase = (mesocycle: Mesocycle): MesocyclePhase => {
    if (!mesocycle) return 'accumulation';
    
    const { currentWeek, weeks } = mesocycle;
    if (currentWeek >= weeks) return 'deload';
    if (currentWeek === weeks - 1) return 'intensification';
    return 'accumulation';
};

/**
 * Detects the training week based on session dates, looking for breaks >= 7 days.
 * If a 7-day break is found, the week counter resets.
 */
export const detectTrainingWeekFromHistory = (sessions: Session[]): number => {
    const validSessions = sessions.filter(s => s.isCompleted && !s.deletedAt).sort((a, b) => a.date - b.date);
    if (validSessions.length === 0) return 1;

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    let currentWeekStart = validSessions[0].date;
    let weekCounter = 1;

    for (let i = 1; i < validSessions.length; i++) {
        const diffDays = (validSessions[i].date - validSessions[i - 1].date) / MS_PER_DAY;
        
        // If 7 or more days passed without a session, we consider it a reset (deload/break)
        if (diffDays >= 7) {
            currentWeekStart = validSessions[i].date;
            weekCounter = 1;
            continue;
        }

        // Calculate weeks passed since the start of this continuous block
        const weeksSinceStart = Math.floor((validSessions[i].date - currentWeekStart) / (7 * MS_PER_DAY)) + 1;
        weekCounter = weeksSinceStart;
    }

    return weekCounter;
};

/**
 * Calculates progressive weekly volume for a specific muscle.
 */
export const getRecommendedWeeklyVolume = (
    muscle: MuscleGroup,
    currentWeek: number,
    totalWeeks: number,
    baselineSets: number
): { sets: number; intensity: 'light' | 'moderate' | 'heavy' } => {
    const isDeload = currentWeek >= totalWeeks;
    
    if (isDeload) {
        return {
            sets: Math.max(1, Math.floor(baselineSets / 2)),
            intensity: 'light'
        };
    }

    // Week 1 -> baseline
    // Week 2 -> baseline + 1
    // Week 3 -> baseline + 2, etc.
    const addedSets = Math.max(0, currentWeek - 1);
    const sets = baselineSets + addedSets;
    
    // Intensification is the week before deload
    const isIntensification = currentWeek === totalWeeks - 1;
    const intensity = isIntensification ? 'heavy' : 'moderate';

    return { sets, intensity };
};

/**
 * Checks if user is overreaching based on recent 7 days volume.
 */
export const getOverreachWarning = (
    sessions: Session[],
    exercises: Exercise[]
): { muscle: MuscleGroup; severity: 'warning' | 'critical'; recommendation: string }[] => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const last7Days = sessions.filter(s => s.isCompleted && !s.deletedAt && (now - s.date) <= 7 * MS_PER_DAY);

    // Calculate volume per muscle
    const muscleVolume: Record<string, number> = {};
    
    last7Days.forEach(session => {
        session.sets.forEach(set => {
            if (!set.isCompleted || set.type === 'warmup') return;
            const ex = exercises.find(e => e.id === set.exerciseId);
            if (ex && ex.targetMuscle) {
                muscleVolume[ex.targetMuscle] = (muscleVolume[ex.targetMuscle] || 0) + 1;
            }
        });
    });

    const warnings: { muscle: MuscleGroup; severity: 'warning' | 'critical'; recommendation: string }[] = [];

    (Object.keys(muscleVolume) as MuscleGroup[]).forEach(muscle => {
        const sets = muscleVolume[muscle];
        const zone = getVolumeZone(muscle, sets);
        const mrv = VOLUME_LANDMARKS[muscle]?.mrv || 20;

        if (zone === 'over_mrv') {
            warnings.push({
                muscle,
                severity: 'critical',
                recommendation: `O volume semanal de ${muscle} está em ${sets} séries (MRV é ${mrv}). Overtraining detectado. Reduza imediatamente em 50% ou faça um deload.`
            });
        } else if (zone === 'mrv') {
            warnings.push({
                muscle,
                severity: 'warning',
                recommendation: `O volume semanal de ${muscle} atingiu o MRV (${sets} séries). Não adicione mais séries e prepare-se para um deload em breve.`
            });
        }
    });

    return warnings;
};
