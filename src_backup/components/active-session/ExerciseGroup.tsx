
import React, { useMemo, useState } from 'react';
import { Exercise, WorkoutSet, Session } from '../../types';
import { Plus, Info, Trophy, CheckCircle2 } from 'lucide-react';
import SetRow from './SetRow';
import { useWorkoutLogic } from '../../hooks/useWorkoutLogic';
import { cn } from '../../lib/utils';
import ExerciseDetailModal from '../exercise/ExerciseDetailModal';

interface Props {
    exercise: Exercise;
    sets: WorkoutSet[];
    history: Session[];
    allExerciseIds: string[];
    registerRef?: (id: string, node: HTMLDivElement | null) => void;
    onAutoScrollRequest?: (nextExerciseId: string) => void;
}

const ExerciseGroup: React.FC<Props> = ({
    exercise,
    sets,
    history,
    allExerciseIds,
    registerRef,
    onAutoScrollRequest
}) => {
    const { handleAddSet, handleUpdateSet, handleCompleteSet, handleDeleteSet, getInputId } = useWorkoutLogic();
    const [showDetails, setShowDetails] = useState(false);

    // Find previous session data for "Ghost Text"
    const previousSets = useMemo(() => {
        const lastSession = history.find(s => s.sets.some(k => k.exerciseId === exercise.id));
        return lastSession ? lastSession.sets.filter(k => k.exerciseId === exercise.id) : [];
    }, [history, exercise.id]);

    // Check if all sets are done
    const allSetsCompleted = sets.length > 0 && sets.every(s => s.isCompleted);

    // Enhanced Completion Handler to trigger Auto-Scroll
    const onSetComplete = (set: WorkoutSet, index: number) => {
        handleCompleteSet(set, exercise.id, index, allExerciseIds);

        if (!set.isCompleted && index === sets.length - 1) {
            const currentIdx = allExerciseIds.indexOf(exercise.id);
            if (currentIdx < allExerciseIds.length - 1) {
                const nextId = allExerciseIds[currentIdx + 1];
                if (onAutoScrollRequest) {
                    onAutoScrollRequest(nextId);
                }
            }
        }
    };

    return (
        <>
            <div
                id={`group-${exercise.id}`}
                ref={(node) => registerRef?.(exercise.id, node)}
                className={cn(
                    "scroll-mt-32 transition-opacity duration-500",
                    allSetsCompleted ? "opacity-60 grayscale-[0.5]" : "opacity-100"
                )}
            >
                {/* Exercise Card Container */}
                <div className={cn(
                    "rounded-[4px] overflow-hidden transition-all duration-300",
                    allSetsCompleted
                        ? "bg-zinc-950 border border-white/5"
                        : "bg-zinc-900/40 border border-white/10 shadow-card"
                )}>

                    {/* Card Header (Clickable) */}
                    <div
                        onClick={() => setShowDetails(true)}
                        className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors group"
                    >
                        <div className="relative w-14 h-14 rounded-[4px] bg-black overflow-hidden border border-white/10 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                            <img
                                src={exercise.staticImageUrl || exercise.gifUrl}
                                className="w-full h-full object-cover opacity-80 mix-blend-screen"
                                loading="lazy"
                            />
                            {/* Muscle Badge */}
                            <div className="absolute bottom-0 inset-x-0 h-1 bg-brand-primary" />
                            {allSetsCompleted && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                                    <CheckCircle2 size={24} className="text-brand-success" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-heading font-black text-lg leading-tight truncate pr-2 group-hover:text-brand-primary transition-colors">
                                {exercise.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                    {exercise.targetMuscle}
                                </span>
                                {exercise.personalRecord && (
                                    <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                                        <Trophy size={10} className="text-brand-warning" />
                                        <span className="text-brand-warning">{exercise.personalRecord}kg</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 bg-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-primary hover:text-white">
                            <Info size={16} />
                        </button>
                    </div>

                    {/* Column Headers (Hidden on Mobile for cleaner look? No, keep subtle) */}
                    <div className="grid grid-cols-[40px_1fr_1fr_50px_60px] gap-3 px-2 pb-2">
                        <div className="text-[9px] font-bold text-zinc-600 text-center uppercase tracking-wider">Set</div>
                        <div className="text-[9px] font-bold text-zinc-600 text-center uppercase tracking-wider">Load</div>
                        <div className="text-[9px] font-bold text-zinc-600 text-center uppercase tracking-wider">Reps</div>
                        <div className="text-[9px] font-bold text-zinc-600 text-center uppercase tracking-wider">RPE</div>
                        <div className="text-[9px] font-bold text-zinc-600 text-center uppercase tracking-wider">Log</div>
                    </div>

                    {/* Sets List */}
                    <div className="px-2 pb-2">
                        {sets.map((set, idx) => (
                            <SetRow
                                key={set.id}
                                index={idx}
                                set={set}
                                previousSet={previousSets[idx]}
                                getInputId={(field) => getInputId(exercise.id, idx, field)}
                                onUpdate={(field, val) => handleUpdateSet(set.id, field, val)}
                                onComplete={() => onSetComplete(set, idx)}
                                onDelete={() => handleDeleteSet(set.id)}
                            />
                        ))}
                    </div>

                    {/* Footer Action */}
                    <div className="p-2 pt-0">
                        <button
                            onClick={() => handleAddSet(exercise.id)}
                            className="w-full py-3 rounded-[4px] bg-zinc-950/50 hover:bg-brand-primary/10 text-zinc-500 hover:text-brand-primary text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-dashed border-zinc-800 hover:border-brand-primary/30"
                        >
                            <Plus size={16} /> Add Set
                        </button>
                    </div>

                </div>
            </div>

            {/* Details Modal */}
            {showDetails && (
                <ExerciseDetailModal
                    exercise={exercise}
                    onClose={() => setShowDetails(false)}
                />
            )}
        </>
    );
};

export default React.memo(ExerciseGroup);
