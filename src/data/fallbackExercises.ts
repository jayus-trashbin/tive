
import { Exercise } from '../types';

// Using a reliable placeholder service for fallbacks to ensure UI doesn't look broken if API fails.
const getPlaceholder = (text: string, color: string = '6366f1') => 
  `https://placehold.co/600x400/18181b/${color}/png?text=${encodeURIComponent(text)}`;

export const FALLBACK_EXERCISES: Exercise[] = [
  { 
    id: 'fb_1', 
    name: 'Barbell Squat', 
    targetMuscle: 'upper legs', 
    gifUrl: getPlaceholder('Barbell Squat (GIF)', 'f97316'), 
    staticImageUrl: getPlaceholder('Barbell Squat', 'f97316'),
    fatigueFactor: 1.5, 
    isUnilateral: false,
    equipment: 'barbell',
    secondaryMuscles: ['glutes', 'lower back', 'calves', 'core'],
    instructions: [
        "Position the barbell on your upper back (traps), feet shoulder-width apart.",
        "Brace your core deeply and keep your chest up.",
        "Descend by pushing your hips back and bending your knees.",
        "Go down until your thighs are at least parallel to the floor.",
        "Drive back up through your heels, keeping knees in line with toes."
    ]
  },
  { 
    id: 'fb_2', 
    name: 'Barbell Bench Press', 
    targetMuscle: 'chest', 
    gifUrl: getPlaceholder('Bench Press (GIF)', '3b82f6'), 
    staticImageUrl: getPlaceholder('Bench Press', '3b82f6'),
    fatigueFactor: 1.5, 
    isUnilateral: false,
    equipment: 'barbell',
    secondaryMuscles: ['triceps', 'front delts'],
    instructions: [
        "Lie on the bench with your eyes under the bar.",
        "Grip the bar slightly wider than shoulder-width.",
        "Unrack the bar and stabilize it over your chest.",
        "Lower the bar with control to your mid-chest (sternum).",
        "Press the bar back up explosively to the starting position."
    ]
  },
  { 
    id: 'fb_3', 
    name: 'Barbell Deadlift', 
    targetMuscle: 'back', 
    gifUrl: getPlaceholder('Deadlift (GIF)', '10b981'), 
    staticImageUrl: getPlaceholder('Deadlift', '10b981'),
    fatigueFactor: 1.8, 
    isUnilateral: false,
    equipment: 'barbell',
    secondaryMuscles: ['glutes', 'hamstrings', 'forearms', 'traps'],
    instructions: [
        "Stand with feet hip-width apart, barbell over mid-foot.",
        "Hinge at hips to grab the bar just outside your legs.",
        "Flatten your back, drop hips slightly, and pull chest up.",
        "Drive through the floor to lift the weight, keeping it close to your shins.",
        "Lock out hips at the top, then control the weight back down."
    ]
  },
  { 
    id: 'fb_4', 
    name: 'Overhead Press', 
    targetMuscle: 'shoulders', 
    gifUrl: getPlaceholder('Overhead Press (GIF)', 'a855f7'), 
    staticImageUrl: getPlaceholder('Overhead Press', 'a855f7'),
    fatigueFactor: 1.2, 
    isUnilateral: false,
    equipment: 'barbell',
    secondaryMuscles: ['triceps', 'upper chest', 'core'],
    instructions: [
        "Hold the bar at shoulder level with forearms vertical.",
        "Squeeze glutes and core to stabilize torso.",
        "Press the bar vertically overhead until arms are locked out.",
        "Push your head through slightly at the top.",
        "Lower the bar back to the front rack position with control."
    ]
  },
  { 
    id: 'fb_5', 
    name: 'Pull Up', 
    targetMuscle: 'back', 
    gifUrl: getPlaceholder('Pull Up (GIF)', '10b981'), 
    staticImageUrl: getPlaceholder('Pull Up', '10b981'),
    fatigueFactor: 1.2, 
    isUnilateral: false,
    equipment: 'body weight',
    secondaryMuscles: ['biceps', 'rear delts'],
    instructions: [
        "Grab the pull-up bar with palms facing away, slightly wider than shoulders.",
        "Hang freely, then pull your shoulder blades down and back.",
        "Pull your chest towards the bar by driving elbows down.",
        "Chin should clear the bar at the top.",
        "Lower yourself slowly to a full dead hang."
    ]
  },
  { 
    id: 'fb_6', 
    name: 'Dumbbell Row', 
    targetMuscle: 'back', 
    gifUrl: getPlaceholder('DB Row (GIF)', '10b981'), 
    staticImageUrl: getPlaceholder('DB Row', '10b981'),
    fatigueFactor: 1.0, 
    isUnilateral: true,
    equipment: 'dumbbell',
    secondaryMuscles: ['biceps', 'forearms'],
    instructions: [
        "Place one knee and hand on a bench for support.",
        "Keep your back flat and parallel to the ground.",
        "Pull the dumbbell up towards your hip, keeping elbow close to body.",
        "Squeeze your lat at the top.",
        "Lower the weight to a full stretch."
    ]
  },
  { 
    id: 'fb_7', 
    name: 'Dumbbell Incline Bench', 
    targetMuscle: 'chest', 
    gifUrl: getPlaceholder('Incline DB Press (GIF)', '3b82f6'), 
    staticImageUrl: getPlaceholder('Incline DB Press', '3b82f6'),
    fatigueFactor: 1.1, 
    isUnilateral: true,
    equipment: 'dumbbell',
    secondaryMuscles: ['shoulders', 'triceps'],
    instructions: [
        "Set bench to 30-45 degree incline.",
        "Kick dumbbells up to your shoulders.",
        "Press the weights up and slightly in.",
        "Lower slowly until you feel a stretch in the upper chest.",
        "Repeat for reps."
    ]
  },
  { 
    id: 'fb_8', 
    name: 'Leg Press', 
    targetMuscle: 'upper legs', 
    gifUrl: getPlaceholder('Leg Press (GIF)', 'f97316'), 
    staticImageUrl: getPlaceholder('Leg Press', 'f97316'),
    fatigueFactor: 1.0, 
    isUnilateral: false,
    equipment: 'machine',
    secondaryMuscles: ['glutes', 'calves'],
    instructions: [
        "Place feet shoulder-width apart on the platform.",
        "Lower the weight until knees are at 90 degrees.",
        "Push back up through your heels.",
        "Do not lock out knees at the top."
    ]
  },
  { 
    id: 'fb_9', 
    name: 'Romanian Deadlift', 
    targetMuscle: 'upper legs', 
    gifUrl: getPlaceholder('RDL (GIF)', 'f97316'), 
    staticImageUrl: getPlaceholder('RDL', 'f97316'),
    fatigueFactor: 1.4, 
    isUnilateral: false,
    equipment: 'barbell',
    secondaryMuscles: ['glutes', 'lower back'],
    instructions: [
        "Hold barbell at hip level.",
        "Hinge hips back while keeping legs slightly bent but rigid.",
        "Lower bar along legs until you feel a deep stretch in hamstrings.",
        "Squeeze glutes to return to standing."
    ]
  },
  { 
    id: 'fb_10', 
    name: 'Lateral Raise', 
    targetMuscle: 'shoulders', 
    gifUrl: getPlaceholder('Lat Raise (GIF)', 'a855f7'), 
    staticImageUrl: getPlaceholder('Lat Raise', 'a855f7'),
    fatigueFactor: 0.8, 
    isUnilateral: true,
    equipment: 'dumbbell',
    secondaryMuscles: ['traps'],
    instructions: [
        "Stand with dumbbells at sides.",
        "Raise arms out to the sides until shoulder height.",
        "Keep a slight bend in elbows.",
        "Lower slowly."
    ]
  },
  { 
    id: 'fb_11', 
    name: 'Standing Calf Raise', 
    targetMuscle: 'lower legs', 
    gifUrl: getPlaceholder('Calf Raise (GIF)', 'eab308'), 
    staticImageUrl: getPlaceholder('Calf Raise', 'eab308'),
    fatigueFactor: 0.7, 
    isUnilateral: false,
    equipment: 'machine',
    secondaryMuscles: [],
    instructions: [
        "Place shoulders under pads and balls of feet on platform.",
        "Lower heels as far as possible for a full stretch.",
        "Raise heels as high as possible.",
        "Pause at the top."
    ]
  }
];
