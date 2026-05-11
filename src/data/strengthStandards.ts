export type StandardLevel = 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced' | 'Elite';
export type LiftType = 'Squat' | 'Bench Press' | 'Deadlift' | 'Overhead Press' | 'Barbell Row';

export interface LiftStandard {
    lift: LiftType;
    multiplier: number; // Multiplier of Bodyweight
}

// These are approximate standards for a 75kg male
// Multipliers represent e1RM / Bodyweight
export const maleStandards: Record<StandardLevel, LiftStandard[]> = {
    Beginner: [
        { lift: 'Squat', multiplier: 0.9 },
        { lift: 'Bench Press', multiplier: 0.7 },
        { lift: 'Deadlift', multiplier: 1.1 },
        { lift: 'Overhead Press', multiplier: 0.4 },
        { lift: 'Barbell Row', multiplier: 0.6 },
    ],
    Novice: [
        { lift: 'Squat', multiplier: 1.2 },
        { lift: 'Bench Press', multiplier: 0.9 },
        { lift: 'Deadlift', multiplier: 1.4 },
        { lift: 'Overhead Press', multiplier: 0.6 },
        { lift: 'Barbell Row', multiplier: 0.8 },
    ],
    Intermediate: [
        { lift: 'Squat', multiplier: 1.5 },
        { lift: 'Bench Press', multiplier: 1.1 },
        { lift: 'Deadlift', multiplier: 1.8 },
        { lift: 'Overhead Press', multiplier: 0.8 },
        { lift: 'Barbell Row', multiplier: 1.0 },
    ],
    Advanced: [
        { lift: 'Squat', multiplier: 1.9 },
        { lift: 'Bench Press', multiplier: 1.4 },
        { lift: 'Deadlift', multiplier: 2.2 },
        { lift: 'Overhead Press', multiplier: 1.0 },
        { lift: 'Barbell Row', multiplier: 1.3 },
    ],
    Elite: [
        { lift: 'Squat', multiplier: 2.3 },
        { lift: 'Bench Press', multiplier: 1.7 },
        { lift: 'Deadlift', multiplier: 2.6 },
        { lift: 'Overhead Press', multiplier: 1.3 },
        { lift: 'Barbell Row', multiplier: 1.6 },
    ]
};

export const femaleStandards: Record<StandardLevel, LiftStandard[]> = {
    Beginner: [
        { lift: 'Squat', multiplier: 0.6 },
        { lift: 'Bench Press', multiplier: 0.4 },
        { lift: 'Deadlift', multiplier: 0.7 },
        { lift: 'Overhead Press', multiplier: 0.3 },
        { lift: 'Barbell Row', multiplier: 0.4 },
    ],
    Novice: [
        { lift: 'Squat', multiplier: 0.9 },
        { lift: 'Bench Press', multiplier: 0.6 },
        { lift: 'Deadlift', multiplier: 1.0 },
        { lift: 'Overhead Press', multiplier: 0.4 },
        { lift: 'Barbell Row', multiplier: 0.6 },
    ],
    Intermediate: [
        { lift: 'Squat', multiplier: 1.2 },
        { lift: 'Bench Press', multiplier: 0.8 },
        { lift: 'Deadlift', multiplier: 1.4 },
        { lift: 'Overhead Press', multiplier: 0.6 },
        { lift: 'Barbell Row', multiplier: 0.8 },
    ],
    Advanced: [
        { lift: 'Squat', multiplier: 1.5 },
        { lift: 'Bench Press', multiplier: 1.0 },
        { lift: 'Deadlift', multiplier: 1.8 },
        { lift: 'Overhead Press', multiplier: 0.8 },
        { lift: 'Barbell Row', multiplier: 1.0 },
    ],
    Elite: [
        { lift: 'Squat', multiplier: 1.8 },
        { lift: 'Bench Press', multiplier: 1.3 },
        { lift: 'Deadlift', multiplier: 2.2 },
        { lift: 'Overhead Press', multiplier: 1.0 },
        { lift: 'Barbell Row', multiplier: 1.3 },
    ]
};

export const getStandardLevel = (lift: LiftType, gender: 'male'|'female'|'other', bodyweight: number, e1RM: number): StandardLevel | 'Untrained' => {
    if (e1RM === 0 || bodyweight === 0) return 'Untrained';
    
    const standards = gender === 'female' ? femaleStandards : maleStandards;
    const ratio = e1RM / bodyweight;
    
    const levels: StandardLevel[] = ['Elite', 'Advanced', 'Intermediate', 'Novice', 'Beginner'];
    
    for (const level of levels) {
        const std = standards[level].find(s => s.lift === lift);
        if (std && ratio >= std.multiplier) return level;
    }
    
    return 'Untrained';
};
