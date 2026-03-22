import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Exercise } from '../../types';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getExerciseById } from '../../services/exerciseService';
import { ExerciseHeader } from '../exercise-detail/ExerciseHeader';
import { ExerciseInfo } from '../exercise-detail/ExerciseInfo';
import { ExerciseTabs } from '../exercise-detail/ExerciseTabs';
import { ExerciseGuide } from '../exercise-detail/ExerciseGuide';
import { ExerciseHistory } from '../exercise-detail/ExerciseHistory';
import { ExerciseAnatomy } from '../exercise-detail/ExerciseAnatomy';

interface Props {
    exercise: Exercise | null;
    onClose: () => void;
}

const ExerciseDetailModal: React.FC<Props> = ({ exercise, onClose }) => {
    const history = useWorkoutStore(state => state.history);
    const addExercise = useWorkoutStore(state => state.addExercise);
    const [activeTab, setActiveTab] = useState<'guide' | 'history' | 'anatomy'>('guide');

    // Local state to handle fetched updates (e.g. videoUrl loaded later)
    const [localExercise, setLocalExercise] = useState<Exercise | null>(exercise);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    // Sync prop change
    useEffect(() => {
        setLocalExercise(exercise);
    }, [exercise]);

    // --- AUTO-ENRICHMENT: Fetch details if missing ---
    useEffect(() => {
        if (exercise && exercise.id.startsWith('exr_')) {
            // If exercise is from API but lacks rich details (video, tips), fetch them.
            const isMissingDetails = !exercise.videoUrl && !exercise.overview && (!exercise.tips || exercise.tips.length === 0);

            if (isMissingDetails) {
                setIsFetchingDetails(true);
                const fetchDetails = async () => {
                    try {
                        const fullData = await getExerciseById(exercise.id);
                        if (fullData) {
                            // Merge with existing local stats (PRs, timestamps) that might be in 'exercise' prop but not from API
                            const enriched = { ...exercise, ...fullData };
                            setLocalExercise(enriched);
                            addExercise(enriched); // Persist to store so next time it's instant
                        }
                    } catch (e) {
                        console.warn("Failed to enrich exercise details");
                    } finally {
                        setIsFetchingDetails(false);
                    }
                };
                fetchDetails();
            }
        }
    }, [exercise, addExercise]);

    // Reset state on open
    useEffect(() => {
        if (localExercise) {
            setActiveTab('guide');
        }
    }, [localExercise?.id]); // Only reset if ID changes

    // --- RUNTIME DATA ANALYSIS ---
    const exerciseHistory = useMemo(() => {
        if (!localExercise) return [];
        const logs: { date: number; weight: number; reps: number; rpe: number; '1rm': number }[] = [];

        history.forEach(session => {
            const relevantSets = session.sets.filter(s => s.exerciseId === localExercise.id && s.isCompleted);
            if (relevantSets.length > 0) {
                // Find best set of the session
                const bestSet = relevantSets.reduce((prev, curr) => (prev.estimated1RM > curr.estimated1RM ? prev : curr));
                logs.push({
                    date: session.date,
                    weight: bestSet.weight,
                    reps: bestSet.reps,
                    rpe: bestSet.rpe,
                    '1rm': bestSet.estimated1RM
                });
            }
        });
        return logs.sort((a, b) => b.date - a.date).reverse().slice(0, 10); // Last 10 sessions, newest first
    }, [localExercise, history]);

    if (!localExercise) return null;

    return (
        <AnimatePresence>
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl"
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed inset-0 sm:inset-4 md:inset-10 z-[75] flex items-center justify-center pointer-events-none"
                >
                    <div className="w-full max-w-lg h-full sm:h-[90vh] bg-zinc-950 border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl pointer-events-auto relative">

                        <ExerciseHeader
                            exercise={localExercise}
                            onClose={onClose}
                            isFetchingDetails={isFetchingDetails}
                        />

                        {/* --- CONTENT SCROLL AREA --- */}
                        <div className="flex-1 overflow-y-auto bg-zinc-950 relative">

                            <ExerciseInfo exercise={localExercise} />

                            <ExerciseTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                            {/* --- TAB CONTENT --- */}
                            <div className="px-6 pb-safe">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'guide' ? (
                                        <ExerciseGuide exercise={localExercise} />
                                    ) : activeTab === 'history' ? (
                                        <ExerciseHistory history={exerciseHistory} />
                                    ) : (
                                        <ExerciseAnatomy exercise={localExercise} />
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </>
        </AnimatePresence>
    );
};

export default ExerciseDetailModal;
