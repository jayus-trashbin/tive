
import React, { useMemo, useEffect, useState } from 'react';
import { Routine, Exercise } from '../../types';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getExerciseById } from '../../services/exerciseService';
import { ArrowLeft, Clock, Dumbbell, Play, ChevronRight, Zap, Loader2, Edit2, Target } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ExerciseDetailModal from '../exercise/ExerciseDetailModal';
import { estimateRoutineDuration } from '../../utils/engine';
import { calculateACWR } from '../../utils/engine';
import { cn } from '../../lib/utils';

interface Props {
  routineId: string;
  onBack: () => void;
  onBegin: () => void;
  onEdit: () => void; // New prop
}

const RoutinePreviewScreen: React.FC<Props> = ({ routineId, onBack, onBegin, onEdit }) => {
  const { routines, exercises, history, addExercise } = useWorkoutStore();
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  const routine = useMemo(() => 
    routines.find(r => r.id === routineId), 
  [routines, routineId]);

  const getMuscleGradient = (muscle: string) => {
      const lower = muscle.toLowerCase();
      if (lower.includes('chest') || lower.includes('push')) return 'bg-gradient-to-br from-red-900/40 to-zinc-800';
      if (lower.includes('back') || lower.includes('pull')) return 'bg-gradient-to-br from-blue-900/40 to-zinc-800';
      if (lower.includes('leg')) return 'bg-gradient-to-br from-green-900/40 to-zinc-800';
      return 'bg-gradient-to-br from-brand-primary/20 to-zinc-800';
  };

  // --- SELF HEALING ---
  useEffect(() => {
    if (!routine) return;

    const loadMissing = async () => {
        const requiredIds = routine.blocks 
            ? routine.blocks.map(b => b.exerciseId) 
            : routine.exerciseIds;

        const missingIds = requiredIds.filter(id => !exercises.find(e => e.id === id));
        
        if (missingIds.length > 0) {
            setIsLoadingDetails(true);
            await Promise.all(missingIds.map(async (id) => {
                const ex = await getExerciseById(id);
                if (ex) addExercise(ex);
            }));
            setIsLoadingDetails(false);
        }
    };
    loadMissing();
  }, [routine, exercises, addExercise]);


  if (!routine) return null;

  // Derive Display Data
  const displayItems = useMemo(() => {
    const items: { exercise: Exercise | null, summary: string, id: string }[] = [];
    
    if (routine.blocks) {
        routine.blocks.forEach(block => {
            const ex = exercises.find(e => e.id === block.exerciseId) || null;
            const setOne = block.sets[0];
            const setString = `${block.sets.length} sets × ${setOne?.targetReps || '10'}${setOne?.targetWeight ? ` @ ${setOne.targetWeight}kg` : ''}`;
            items.push({ exercise: ex, summary: setString, id: block.id });
        });
    } else {
        routine.exerciseIds.forEach((eid, idx) => {
            const ex = exercises.find(e => e.id === eid) || null;
            items.push({ exercise: ex, summary: "3 sets × 10 reps", id: `legacy-${idx}` });
        });
    }
    return items;
  }, [routine, exercises]);

  const totalSets = useMemo(() => {
    if (routine.blocks) {
      return routine.blocks.reduce((acc, b) => acc + b.sets.length, 0);
    }
    return routine.exerciseIds.length * 3;
  }, [routine]);

  const estTime = estimateRoutineDuration(routine);

  // R-04: Muscle distribution
  const muscleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    const blocks = routine?.blocks ?? [];
    blocks.forEach(b => {
      const ex = exercises.find(e => e.id === b.exerciseId);
      if (ex) counts[ex.targetMuscle] = (counts[ex.targetMuscle] || 0) + b.sets.length;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([muscle, count]) => ({ muscle, pct: Math.round((count / total) * 100) }));
  }, [routine, exercises]);

  // R-04: ACWR-based readiness from history
  const acwr = useMemo(() => {
    if (!history || history.length < 4) return null;
    return calculateACWR(history);
  }, [history]);

  const coverExerciseId = routine?.blocks?.[0]?.exerciseId || routine?.exerciseIds?.[0];
  const coverExercise = exercises.find(e => e.id === coverExerciseId);
  const coverImage = coverExercise?.staticImageUrl || (coverExercise?.gifUrl ? `https://wsrv.nl/?url=${encodeURIComponent(coverExercise.gifUrl)}&n=1&output=png` : null);

  const riskLabel = acwr
    ? acwr.risk === 'optimal' ? { text: 'Ready', color: 'text-brand-primary border-brand-primary/30 bg-brand-primary/10' }
    : acwr.risk === 'high'    ? { text: 'High Load', color: 'text-red-400 border-red-500/30 bg-red-500/10' }
    : { text: 'Under-trained', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' }
    : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex justify-center">
        <div className="w-full max-w-lg md:max-w-2xl h-full bg-zinc-950 flex flex-col animate-in slide-in-from-bottom-10 shadow-2xl overflow-hidden relative">
      
            {/* Header Image/Gradient */}
            <div className="relative h-64 shrink-0 overflow-hidden">
                {coverImage && <img src={coverImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Cover" loading="lazy" />}
                <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 via-zinc-950/80 to-zinc-950 z-0" />
                
                {/* Header Controls */}
                <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex items-center justify-between z-10">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/40 transition-colors">
                        <ArrowLeft size={20} />
                    </button>

                     <button onClick={onEdit} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/40 transition-colors">
                        <Edit2 size={18} />
                    </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-brand-primary text-white text-[10px] font-bold uppercase tracking-wider">
                            Strength
                        </span>
                        {/* R-04: Readiness badge */}
                        {riskLabel && (
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${riskLabel.color}`}>
                                <Target size={9} className="inline mr-1" />{riskLabel.text}
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-white leading-none mb-2">{routine.name}</h1>
                    <div className="flex items-center gap-4 text-zinc-400 text-sm font-medium">
                        <span className="flex items-center gap-1.5"><Clock size={14} /> {estTime} min</span>
                        <span className="flex items-center gap-1.5"><Dumbbell size={14} /> {displayItems.length} Exercises</span>
                    </div>

                    {/* R-04: Muscle distribution bar */}
                    {muscleDistribution.length > 0 && (
                        <div className="mt-3">
                            <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
                                {muscleDistribution.map(({ muscle, pct }) => (
                                    <div
                                        key={muscle}
                                        title={`${muscle} ${pct}%`}
                                        style={{ width: `${pct}%` }}
                                        className="h-full rounded-full bg-brand-primary opacity-80 first:opacity-100"
                                    />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                                {muscleDistribution.slice(0, 4).map(({ muscle, pct }) => (
                                    <span key={muscle} className="text-[9px] font-medium text-zinc-500">
                                        {muscle} <span className="text-zinc-400">{pct}%</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32 no-scrollbar">
                {isLoadingDetails && (
                    <div className="flex items-center justify-center py-4 text-brand-primary">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="ml-2 text-xs font-bold uppercase">Syncing details...</span>
                    </div>
                )}

                {displayItems.map((item, i) => (
                    <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => item.exercise && setSelectedExercise(item.exercise)}
                        className={`flex items-center gap-4 p-3 bg-zinc-900 border border-white/5 rounded-2xl transition-all ${item.exercise ? 'cursor-pointer hover:bg-zinc-800 active:scale-[0.98]' : ''}`}
                    >
                        <div className="w-14 h-14 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-white/5 relative">
                            {item.exercise && (item.exercise.staticImageUrl || item.exercise.gifUrl) ? (
                                <img src={item.exercise.staticImageUrl || `https://wsrv.nl/?url=${encodeURIComponent(item.exercise.gifUrl!)}&n=1&output=png`} className="w-full h-full object-cover opacity-80" loading="lazy" />
                            ) : (
                                <div className={cn(
                                    "w-full h-full flex items-center justify-center",
                                    item.exercise ? getMuscleGradient(item.exercise.targetMuscle) : "bg-zinc-800"
                                )}>
                                    <Dumbbell size={20} className="text-white/20" />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h4 className="text-white font-bold text-sm truncate">
                                {item.exercise ? item.exercise.name : 'Loading...'}
                            </h4>
                            <p className="text-brand-primary text-xs font-medium mt-0.5">{item.summary}</p>
                        </div>

                        <ChevronRight size={16} className="text-zinc-600" />
                    </motion.div>
                ))}
            </div>

            {/* Fade-out gradient indicando scroll */}
            <div className="absolute bottom-[110px] left-0 right-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none z-20" />

            {/* Sticky Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-zinc-950 px-4 pb-safe z-50 pt-2">
                <div className="pointer-events-auto">
                    <div className="text-center mb-3">
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-2">
                            <span>{displayItems.length} Exercises</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span>{totalSets} Sets</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span>~{estTime} Min</span>
                        </p>
                    </div>
                    <button 
                        onClick={onBegin}
                        className="w-full mb-6 py-4 bg-brand-primary text-black font-black text-lg tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_24px_-4px] shadow-brand-primary/40 active:scale-[0.98] hover:brightness-110 transition-all"
                    >
                        <Play size={20} fill="currentColor" /> BEGIN WORKOUT
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {selectedExercise && (
                    <ExerciseDetailModal 
                        exercise={selectedExercise} 
                        onClose={() => setSelectedExercise(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};

export default RoutinePreviewScreen;
