
import React, { useMemo, useEffect, useState } from 'react';
import { Routine, Exercise } from '../../types';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getExerciseById } from '../../services/exerciseService';
import { ArrowLeft, Clock, Dumbbell, Play, ChevronRight, Zap, Loader2, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { estimateRoutineDuration } from '../../utils/engine';

interface Props {
  routineId: string;
  onBack: () => void;
  onBegin: () => void;
  onEdit: () => void; // New prop
}

const RoutinePreviewScreen: React.FC<Props> = ({ routineId, onBack, onBegin, onEdit }) => {
  const { routines, exercises, addExercise } = useWorkoutStore();
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  const routine = useMemo(() => 
    routines.find(r => r.id === routineId), 
  [routines, routineId]);

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

  const estTime = estimateRoutineDuration(routine);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex justify-center">
        <div className="w-full max-w-lg md:max-w-2xl h-full bg-zinc-950 flex flex-col animate-in slide-in-from-bottom-10 shadow-2xl overflow-hidden relative">
      
            {/* Header Image/Gradient */}
            <div className="relative h-64 shrink-0">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/20 to-zinc-950 z-0" />
                
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
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-brand-primary text-white text-[10px] font-bold uppercase tracking-wider">
                            Strength
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-white leading-none mb-2">{routine.name}</h1>
                    <div className="flex items-center gap-4 text-zinc-400 text-sm font-medium">
                        <span className="flex items-center gap-1.5"><Clock size={14} /> {estTime} min</span>
                        <span className="flex items-center gap-1.5"><Dumbbell size={14} /> {displayItems.length} Exercises</span>
                    </div>
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
                        className="flex items-center gap-4 p-3 bg-zinc-900 border border-white/5 rounded-2xl"
                    >
                        <div className="w-14 h-14 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-white/5 relative">
                            {item.exercise ? (
                                <img src={item.exercise.staticImageUrl || item.exercise.gifUrl} className="w-full h-full object-cover opacity-80" loading="lazy" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                    <Dumbbell size={20} className="text-zinc-600" />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h4 className="text-white font-bold text-sm truncate">
                                {item.exercise ? item.exercise.name : 'Loading...'}
                            </h4>
                            <p className="text-brand-primary text-xs font-mono mt-0.5">{item.summary}</p>
                        </div>

                        <ChevronRight size={16} className="text-zinc-600" />
                    </motion.div>
                ))}
            </div>

            {/* Sticky Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-12 px-4 pb-safe z-50">
                <button 
                    onClick={onBegin}
                    className="w-full mb-6 py-4 bg-white text-black font-black text-lg rounded-2xl flex items-center justify-center gap-2 shadow-glow active:scale-[0.98] transition-transform"
                >
                    <Play size={20} fill="currentColor" /> BEGIN WORKOUT
                </button>
            </div>
        </div>
    </div>
  );
};

export default RoutinePreviewScreen;
