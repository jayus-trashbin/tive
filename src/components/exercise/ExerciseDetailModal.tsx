import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../ui';
import { Exercise } from '../../types';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getExerciseById } from '../../services/exerciseService';
import { ExerciseHeader } from '../exercise-detail/ExerciseHeader';
import { ExerciseInfo } from '../exercise-detail/ExerciseInfo';
import { ExerciseTabs } from '../exercise-detail/ExerciseTabs';
import { ExerciseGuide } from '../exercise-detail/ExerciseGuide';
import { ExerciseHistory } from '../exercise-detail/ExerciseHistory';
import { ExerciseAnatomy } from '../exercise-detail/ExerciseAnatomy';
import { logger } from '../../utils/logger';

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
                        logger.warn('ExerciseDetail', 'Failed to enrich exercise details', e);
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

    // Cache non-null exercise to preserve content during modal exit animation
    const [cachedExercise, setCachedExercise] = useState<Exercise | null>(null);
    useEffect(() => {
        if (localExercise) {
            setCachedExercise(localExercise);
        }
    }, [localExercise]);

    const displayExercise = localExercise || cachedExercise;

    // --- RUNTIME DATA ANALYSIS ---
    const exerciseHistory = useMemo(() => {
        if (!displayExercise) return [];
        const logs: { date: number; weight: number; reps: number; rpe: number; '1rm': number }[] = [];

        history.forEach(session => {
            const relevantSets = session.sets.filter(s => s.exerciseId === displayExercise.id && s.isCompleted);
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
    }, [displayExercise, history]);

    if (!displayExercise) return null;

    return (
        <Modal
            isOpen={!!localExercise}
            onClose={onClose}
            showCloseButton={false}
            position="center"
            className="max-w-lg h-full sm:h-[90vh] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem]"
            bodyClassName="p-0 flex flex-col h-full overflow-hidden"
        >
            <div className="flex flex-col h-full overflow-hidden relative">
                <ExerciseHeader
                    exercise={displayExercise}
                    onClose={onClose}
                    isFetchingDetails={isFetchingDetails}
                />

                {/* --- CONTENT SCROLL AREA --- */}
                <div className="flex-1 overflow-y-auto bg-zinc-950 relative no-scrollbar">

                    <ExerciseInfo exercise={displayExercise} />

                    <ExerciseTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                    {/* --- TAB CONTENT --- */}
                    <div className="px-6 pb-safe">
                        <AnimatePresence mode="wait">
                            {activeTab === 'guide' ? (
                                <ExerciseGuide exercise={displayExercise} />
                            ) : activeTab === 'history' ? (
                                <ExerciseHistory history={exerciseHistory} />
                            ) : (
                                <ExerciseAnatomy exercise={displayExercise} />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ExerciseDetailModal;
