import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Exercise, WorkoutSet, MuscleGroup, Session } from '../types';
import { ChevronDown, Calculator, CheckCircle2, Plus, Dumbbell } from 'lucide-react';
import ExerciseGroup from './active-session/ExerciseGroup';
import PlateCalculator from './active-session/PlateCalculator';
import { RestTimerOverlay } from './active-session/RestTimerOverlay';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { useSessionTimer } from '../hooks/useSessionTimer';
import ExercisePicker from './exercise/ExercisePicker';
import { usePhysiology } from '../hooks/usePhysiology';
import { getExerciseById } from '../services/exerciseService';
import { cn } from '../lib/utils';
import LiveMuscleHeatmap from './active-session/LiveMuscleHeatmap';
import PRCelebration from './active-session/PRCelebration';

export interface FinishData {
    session: Session;
    muscleGroups: MuscleGroup[];
    exercises: Map<string, Exercise>;
    previousSession: Session | null;
}

interface Props {
    onFinish: () => void;
    onFinishWithData?: (data: FinishData) => void;
}

/**
 * Workout Player — Active Session
 * 
 * Redesign:
 * - Left-aligned session name, mono timer top-right
 * - Thicker progress bar (h-1.5) with tick marks
 * - Sharp finish modal (rounded-[4px])
 * - Sharp exercise containers
 */
const WorkoutPlayer: React.FC<Props> = ({ onFinish, onFinishWithData }) => {
    const {
        activeSession,
        finishSession,
        exercises,
        history,
        toggleMinimize,
        logSet,
        addExercise,
        triggerPostWorkoutPrompt
    } = useWorkoutStore();
    const { calculate1RM } = usePhysiology();

    const [showPlateCalc, setShowPlateCalc] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [prEvent, setPrEvent] = useState<{ id: string; name: string; weight: number; reps: number } | null>(null);
    const [seenSetIds, setSeenSetIds] = useState<Set<string>>(new Set());

    const { registerRef, scrollToExercise } = useAutoScroll();

    // --- PR DETECTION: Check new completed sets against history ---
    useEffect(() => {
        if (!activeSession) return;
        const completedSets = activeSession.sets.filter(s => s.isCompleted);
        const newCompletedSets = completedSets.filter(s => !seenSetIds.has(s.id));

        if (newCompletedSets.length === 0) return;

        // Update seen
        setSeenSetIds(prev => {
            const next = new Set(prev);
            newCompletedSets.forEach(s => next.add(s.id));
            return next;
        });

        // Check each new set against history for PR
        for (const set of newCompletedSets) {
            if (set.weight <= 0 || set.reps <= 0) continue;
            const e1rm = set.weight * (1 + set.reps / 30); // Epley

            // Find historical best for this exercise
            let bestE1rm = 0;
            for (const session of history) {
                for (const hs of session.sets) {
                    if (hs.exerciseId === set.exerciseId && hs.isCompleted && hs.weight > 0 && hs.reps > 0) {
                        const hE1rm = hs.weight * (1 + hs.reps / 30);
                        if (hE1rm > bestE1rm) bestE1rm = hE1rm;
                    }
                }
            }

            if (e1rm > bestE1rm && bestE1rm > 0) {
                const ex = exercises.find(e => e.id === set.exerciseId);
                setPrEvent({ id: set.id, name: ex?.name || 'Exercise', weight: set.weight, reps: set.reps });
                break; // Only show one at a time
            }
        }
    }, [activeSession?.sets.filter(s => s.isCompleted).length]);

    // --- SELF HEALING: Fetch missing exercises ---
    useEffect(() => {
        if (!activeSession) return;
        const neededIds = new Set([
            ...(activeSession.plannedExerciseIds || []),
            ...activeSession.sets.map(s => s.exerciseId)
        ]);
        const missingIds = Array.from(neededIds).filter(id => !exercises.find(e => e.id === id));
        if (missingIds.length > 0) {
            missingIds.forEach(async (id) => {
                const ex = await getExerciseById(id);
                if (ex) addExercise(ex);
            });
        }
    }, [activeSession, exercises]);

    // Calculate Progress
    const completedSets = activeSession?.sets.filter(s => s.isCompleted).length || 0;
    const totalSets = activeSession?.sets.length || 0;
    const estimatedTotal = Math.max(totalSets, (activeSession?.plannedExerciseIds?.length || 0) * 3);
    const progressPercent = Math.min(100, (completedSets / (estimatedTotal || 1)) * 100);

    // Derive session exercises
    const sessionExercises = useMemo(() => {
        if (!activeSession) return [];
        const planned = (activeSession.plannedExerciseIds || [])
            .map(id => exercises.find(e => e.id === id))
            .filter(Boolean) as Exercise[];
        const loggedIds = Array.from(new Set(activeSession.sets.map(s => s.exerciseId)));
        const freestyle = loggedIds
            .filter(id => !activeSession.plannedExerciseIds?.includes(id))
            .map(id => exercises.find(e => e.id === id))
            .filter(Boolean) as Exercise[];
        const combined = [...planned];
        freestyle.forEach(f => {
            if (!combined.find(c => c.id === f.id)) combined.push(f);
        });
        return combined;
    }, [activeSession, exercises]);

    const allExerciseIds = useMemo(() => sessionExercises.map(e => e.id), [sessionExercises]);

    // Session Timer
    const duration = useSessionTimer(activeSession?.date || 0);

    const handleFinish = async () => {
        if (activeSession) {
            // Capture session snapshot before store clears it
            const sessionSnapshot = { ...activeSession };
            const exerciseIds = [...new Set(activeSession.sets.map(s => s.exerciseId))];
            const muscleGroupsSet = new Set<string>();
            const exerciseMap = new Map<string, Exercise>();

            for (const id of exerciseIds) {
                const exercise = await getExerciseById(id) || exercises.find(e => e.id === id);
                if (exercise) {
                    exerciseMap.set(id, exercise);
                    if (exercise.targetMuscle) muscleGroupsSet.add(exercise.targetMuscle);
                }
            }
            const muscleGroups = Array.from(muscleGroupsSet) as MuscleGroup[];

            // Find previous session of same routine for comparison (by name match)
            const previousSession = activeSession.name
                ? history.find(s => s.name === activeSession.name && s.id !== activeSession.id) || null
                : null;

            // Finish the session in store (clears activeSession)
            finishSession();

            // Trigger photo prompt
            if (muscleGroups.length > 0) {
                triggerPostWorkoutPrompt(sessionSnapshot.id, muscleGroups);
            }

            // Pass data up for summary screen
            if (onFinishWithData) {
                onFinishWithData({
                    session: sessionSnapshot,
                    muscleGroups,
                    exercises: exerciseMap,
                    previousSession
                });
                return; // Don't call onFinish yet — summary will handle dismissal
            }
        } else {
            finishSession();
        }
        onFinish();
    };

    const handleAddExercises = (newIds: string[]) => {
        newIds.forEach(id => {
            if (!activeSession?.sets.some(s => s.exerciseId === id)) {
                const newSet: WorkoutSet = {
                    id: crypto.randomUUID(),
                    exerciseId: id,
                    weight: 0,
                    reps: 0,
                    rpe: 8,
                    timestamp: Date.now(),
                    estimated1RM: 0,
                    isCompleted: false
                };
                logSet(newSet);
            }
        });
        setTimeout(() => scrollToExercise(newIds[0]), 500);
    };

    if (!activeSession) return null;

    return (
        <div className="flex flex-col h-[100dvh] bg-zinc-950 relative overflow-hidden">

            {/* ──── HEADER ──── */}
            <header
                className="shrink-0 px-5 pb-4 bg-zinc-950/90 backdrop-blur-xl z-30 sticky top-0 border-b border-zinc-800/50"
                style={{ paddingTop: `calc(var(--sat) + 1rem)` }}
            >
                <div className="flex justify-between items-center mb-3">
                    {/* Left: minimize + heatmap + session name */}
                    <div className="flex items-center gap-2 min-w-0">
                        <button
                            onClick={() => toggleMinimize(true)}
                            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all rounded-[4px] shrink-0"
                        >
                            <ChevronDown size={22} />
                        </button>
                        <LiveMuscleHeatmap
                            sets={activeSession.sets}
                            exercises={exercises}
                            size={40}
                        />
                        <h1 className="text-base font-heading font-black text-white uppercase tracking-tight truncate">
                            {activeSession.name}
                        </h1>
                    </div>

                    {/* Right: timer + finish */}
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-mono font-bold text-brand-primary tabular-nums tracking-wider">
                            {duration}
                        </span>
                        <button
                            onClick={() => setShowFinishModal(true)}
                            className="btn-tech text-[10px] px-4 py-2 rounded-[2px] cursor-pointer"
                        >
                            Finish
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-zinc-900 overflow-hidden flex">
                    <motion.div
                        className="h-full bg-brand-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </header>

            {/* ──── EXERCISE LIST ──── */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-40">
                <div className="px-5 py-4 space-y-5">

                    {/* Quick Tools */}
                    <div className="flex justify-between items-center">
                        <div className="section-title">Running Order</div>
                        <button
                            onClick={() => setShowPlateCalc(!showPlateCalc)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-[10px] font-heading font-bold text-zinc-400 border border-zinc-800 hover:border-brand-primary/50 transition-colors active:scale-95 rounded-[4px]"
                        >
                            <Calculator size={12} /> Plates
                        </button>
                    </div>

                    <AnimatePresence>
                        {showPlateCalc && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <PlateCalculator targetWeight={100} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Exercises */}
                    <div className="space-y-4">
                        {sessionExercises.length === 0 ? (
                            <div className="text-center py-16 px-8 border border-dashed border-zinc-800 rounded-[4px]">
                                <Dumbbell className="mx-auto text-zinc-700 mb-4" size={40} />
                                <p className="text-zinc-400 font-heading font-bold text-sm uppercase">Session Empty</p>
                                <p className="data-label mt-1">Add an exercise to get started</p>
                            </div>
                        ) : (
                            sessionExercises.map((ex) => (
                                <ExerciseGroup
                                    key={ex.id}
                                    exercise={ex}
                                    sets={activeSession.sets.filter(s => s.exerciseId === ex.id)}
                                    history={history}
                                    allExerciseIds={allExerciseIds}
                                    registerRef={registerRef}
                                    onAutoScrollRequest={scrollToExercise}
                                />
                            ))
                        )}
                    </div>

                    {/* Add Exercise */}
                    <button
                        onClick={() => setShowExercisePicker(true)}
                        className="w-full py-4 border border-dashed border-zinc-800 hover:border-brand-primary/50 text-zinc-500 hover:text-brand-primary transition-all flex items-center justify-center gap-2 font-heading font-bold text-xs uppercase tracking-wider active:scale-[0.99] rounded-[4px]"
                    >
                        <Plus size={18} /> Add Exercise
                    </button>
                </div>
            </div>

            {/* Rest Timer */}
            <AnimatePresence>
                <RestTimerOverlay />
            </AnimatePresence>

            {/* PR Celebration */}
            <PRCelebration
                trigger={prEvent?.id || null}
                exerciseName={prEvent?.name}
                weight={prEvent?.weight}
                reps={prEvent?.reps}
            />

            {/* Exercise Picker */}
            <ExercisePicker
                isOpen={showExercisePicker}
                onClose={() => setShowExercisePicker(false)}
                onSelect={handleAddExercises}
            />

            {/* ──── FINISH MODAL ──── */}
            <AnimatePresence>
                {showFinishModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-zinc-950 border border-zinc-800 rounded-[4px] p-8 w-full max-w-sm text-center shadow-card"
                        >
                            <div className="w-16 h-16 bg-brand-primary/10 flex items-center justify-center mx-auto mb-6 text-brand-primary border border-brand-primary/30 rounded-[4px]">
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 className="page-title text-2xl mb-2">All Done?</h2>
                            <p className="text-zinc-500 mb-8 text-sm">
                                You've completed <span className="text-white font-bold">{completedSets} sets</span> today.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleFinish}
                                    className="w-full py-4 btn-tech text-sm rounded-[2px]"
                                >
                                    Finish Workout
                                </button>
                                <button
                                    onClick={() => setShowFinishModal(false)}
                                    className="w-full py-3 bg-zinc-900 text-zinc-400 font-heading font-bold text-sm uppercase hover:text-white transition-colors rounded-[4px] border border-zinc-800"
                                >
                                    Keep Going
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default WorkoutPlayer;