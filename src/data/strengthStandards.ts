export type StandardLevel = 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced' | 'Elite';
export type LiftType =
    | 'Squat'
    | 'Bench Press'
    | 'Deadlift'
    | 'Overhead Press'
    | 'Barbell Row'
    | 'Romanian Deadlift'
    | 'Pull-up'
    | 'Dumbbell Press';

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
        { lift: 'Romanian Deadlift', multiplier: 0.8 },
        { lift: 'Pull-up', multiplier: 0.5 },
        { lift: 'Dumbbell Press', multiplier: 0.3 },
    ],
    Novice: [
        { lift: 'Squat', multiplier: 1.2 },
        { lift: 'Bench Press', multiplier: 0.9 },
        { lift: 'Deadlift', multiplier: 1.4 },
        { lift: 'Overhead Press', multiplier: 0.6 },
        { lift: 'Barbell Row', multiplier: 0.8 },
        { lift: 'Romanian Deadlift', multiplier: 1.1 },
        { lift: 'Pull-up', multiplier: 0.75 },
        { lift: 'Dumbbell Press', multiplier: 0.45 },
    ],
    Intermediate: [
        { lift: 'Squat', multiplier: 1.5 },
        { lift: 'Bench Press', multiplier: 1.1 },
        { lift: 'Deadlift', multiplier: 1.8 },
        { lift: 'Overhead Press', multiplier: 0.8 },
        { lift: 'Barbell Row', multiplier: 1.0 },
        { lift: 'Romanian Deadlift', multiplier: 1.4 },
        { lift: 'Pull-up', multiplier: 1.0 },
        { lift: 'Dumbbell Press', multiplier: 0.6 },
    ],
    Advanced: [
        { lift: 'Squat', multiplier: 1.9 },
        { lift: 'Bench Press', multiplier: 1.4 },
        { lift: 'Deadlift', multiplier: 2.2 },
        { lift: 'Overhead Press', multiplier: 1.0 },
        { lift: 'Barbell Row', multiplier: 1.3 },
        { lift: 'Romanian Deadlift', multiplier: 1.8 },
        { lift: 'Pull-up', multiplier: 1.3 },
        { lift: 'Dumbbell Press', multiplier: 0.8 },
    ],
    Elite: [
        { lift: 'Squat', multiplier: 2.3 },
        { lift: 'Bench Press', multiplier: 1.7 },
        { lift: 'Deadlift', multiplier: 2.6 },
        { lift: 'Overhead Press', multiplier: 1.3 },
        { lift: 'Barbell Row', multiplier: 1.6 },
        { lift: 'Romanian Deadlift', multiplier: 2.2 },
        { lift: 'Pull-up', multiplier: 1.6 },
        { lift: 'Dumbbell Press', multiplier: 1.0 },
    ]
};

export const femaleStandards: Record<StandardLevel, LiftStandard[]> = {
    Beginner: [
        { lift: 'Squat', multiplier: 0.6 },
        { lift: 'Bench Press', multiplier: 0.4 },
        { lift: 'Deadlift', multiplier: 0.7 },
        { lift: 'Overhead Press', multiplier: 0.3 },
        { lift: 'Barbell Row', multiplier: 0.4 },
        { lift: 'Romanian Deadlift', multiplier: 0.5 },
        { lift: 'Pull-up', multiplier: 0.3 },
        { lift: 'Dumbbell Press', multiplier: 0.2 },
    ],
    Novice: [
        { lift: 'Squat', multiplier: 0.9 },
        { lift: 'Bench Press', multiplier: 0.6 },
        { lift: 'Deadlift', multiplier: 1.0 },
        { lift: 'Overhead Press', multiplier: 0.4 },
        { lift: 'Barbell Row', multiplier: 0.6 },
        { lift: 'Romanian Deadlift', multiplier: 0.75 },
        { lift: 'Pull-up', multiplier: 0.5 },
        { lift: 'Dumbbell Press', multiplier: 0.3 },
    ],
    Intermediate: [
        { lift: 'Squat', multiplier: 1.2 },
        { lift: 'Bench Press', multiplier: 0.8 },
        { lift: 'Deadlift', multiplier: 1.4 },
        { lift: 'Overhead Press', multiplier: 0.6 },
        { lift: 'Barbell Row', multiplier: 0.8 },
        { lift: 'Romanian Deadlift', multiplier: 1.0 },
        { lift: 'Pull-up', multiplier: 0.7 },
        { lift: 'Dumbbell Press', multiplier: 0.45 },
    ],
    Advanced: [
        { lift: 'Squat', multiplier: 1.5 },
        { lift: 'Bench Press', multiplier: 1.0 },
        { lift: 'Deadlift', multiplier: 1.8 },
        { lift: 'Overhead Press', multiplier: 0.8 },
        { lift: 'Barbell Row', multiplier: 1.0 },
        { lift: 'Romanian Deadlift', multiplier: 1.3 },
        { lift: 'Pull-up', multiplier: 0.9 },
        { lift: 'Dumbbell Press', multiplier: 0.6 },
    ],
    Elite: [
        { lift: 'Squat', multiplier: 1.8 },
        { lift: 'Bench Press', multiplier: 1.3 },
        { lift: 'Deadlift', multiplier: 2.2 },
        { lift: 'Overhead Press', multiplier: 1.0 },
        { lift: 'Barbell Row', multiplier: 1.3 },
        { lift: 'Romanian Deadlift', multiplier: 1.6 },
        { lift: 'Pull-up', multiplier: 1.1 },
        { lift: 'Dumbbell Press', multiplier: 0.75 },
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
