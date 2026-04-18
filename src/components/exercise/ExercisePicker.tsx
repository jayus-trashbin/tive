
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, Plus, Loader2, ChevronDown, Dumbbell, PenLine } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getExercises } from '../../services/exerciseService';
import { Exercise } from '../../types';
import { cn } from '../../lib/utils';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import CreateExerciseModal from './CreateExerciseModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exerciseIds: string[]) => void;
  multiSelect?: boolean;
}

// Full mapping of ExerciseDB V2 Bodyparts + Useful Groupings
const MUSCLE_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },

  // Common Groupings
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Legs', value: 'upper legs' }, // Maps to thighs, hams, quads, hips
  { label: 'Arms', value: 'arms' }, // Maps to biceps, triceps, forearms
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Core', value: 'waist' },

  // Specific V2 Bodyparts
  { label: 'Biceps', value: 'biceps' },
  { label: 'Triceps', value: 'triceps' },
  { label: 'Forearms', value: 'forearms' },
  { label: 'Quadriceps', value: 'quadriceps' },
  { label: 'Hamstrings', value: 'hamstrings' },
  { label: 'Calves', value: 'calves' },
  { label: 'Glutes/Hips', value: 'hips' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'Neck', value: 'neck' },
];

const ExercisePicker: React.FC<Props> = ({ isOpen, onClose, onSelect, multiSelect = true }) => {
  const { addExercise: cacheExercise } = useWorkoutStore();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const [results, setResults] = useState<Exercise[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setDebouncedSearch('');
      setActiveFilter('all');
      setSelectedIds([]);
      setResults([]);
      setNextCursor(null);
      loadData({ filter: 'all', query: '' });
    }
  }, [isOpen]);

  // Handle Search or Filter Change
  useEffect(() => {
    if (!isOpen) return;
    loadData({ filter: activeFilter, query: debouncedSearch });
  }, [debouncedSearch, activeFilter]);


  // --- UNIFIED DATA LOADING ---
  const loadData = async (params: { filter: string, query: string }) => {
    setLoading(true);
    setResults([]); // Clear previous to show loading state
    try {
      const response = await getExercises({
        search: params.query,
        muscle: params.filter,
      });

      setResults(response.data);
      setNextCursor(response.nextCursor);
    } catch (e) {
      console.error("Failed to load exercises", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);

    try {
      const response = await getExercises({
        search: debouncedSearch,
        muscle: activeFilter,
        cursor: nextCursor
      });

      if (response.data.length > 0) {
        setResults(prev => [...prev, ...response.data]);
        setNextCursor(response.nextCursor);
      } else {
        setNextCursor(null);
      }
    } catch (e) {
      console.error("Load more failed", e);
    } finally {
      setLoadingMore(false);
    }
  };

  // --- SELECTION LOGIC ---

  const handleToggle = (ex: Exercise) => {
    cacheExercise(ex); // Cache details in store

    if (selectedIds.includes(ex.id)) {
      setSelectedIds(prev => prev.filter(id => id !== ex.id));
    } else {
      if (!multiSelect) {
        setSelectedIds([ex.id]);
      } else {
        setSelectedIds(prev => [...prev, ex.id]);
      }
    }
  };

  const handleConfirm = () => {
    onSelect(selectedIds);
    onClose();
  };

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; }
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 top-8 z-[70] bg-zinc-950 border-t border-zinc-800 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex flex-col gap-3 p-4 bg-zinc-950 border-b border-white/5 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-white">Add Exercise</h2>
                <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search (e.g. Squat)..."
                  aria-label="Buscar exercícios"
                  aria-autocomplete="list"
                  aria-controls="exercise-results"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-brand-primary focus:outline-none transition-colors placeholder:text-zinc-600"
                />
                {loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="animate-spin text-brand-primary" size={16} />
                  </div>
                )}
              </div>

              {/* Muscle Chips */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {MUSCLE_FILTERS.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setActiveFilter(filter.value);
                      setNextCursor(null); // Reset cursor immediately on click
                    }}
                    className={cn(
                      "whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border",
                      activeFilter === filter.value
                        ? "bg-brand-primary text-white border-brand-primary shadow-glow"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 pb-32" id="exercise-results">
              {loading && results.length === 0 ? (
                <div className="space-y-3 p-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-zinc-900 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                      <Dumbbell size={40} className="text-zinc-700 mb-2" />
                      <span className="text-zinc-500 font-medium">No exercises found.</span>
                    </div>
                  ) : (
                    <>
                      {results.map(ex => {
                        const isSelected = selectedIds.includes(ex.id);
                        return (
                          <div
                            key={ex.id}
                            onClick={() => handleToggle(ex)}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer active:scale-[0.99]",
                              isSelected
                                ? "bg-brand-primary/10 border-brand-primary"
                                : "bg-transparent border-transparent hover:bg-zinc-900"
                            )}
                          >
                            <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0 border border-white/5">
                              <ImageWithFallback
                                src={ex.staticImageUrl || ex.gifUrl}
                                alt={ex.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={cn("text-sm font-bold truncate", isSelected ? "text-brand-primary" : "text-white")}>
                                {ex.name}
                              </h4>
                              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                {ex.targetMuscle}
                              </div>
                            </div>
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center border transition-all",
                              isSelected
                                ? "bg-brand-primary border-brand-primary text-white"
                                : "border-zinc-700 text-transparent"
                            )}>
                              <Check size={14} strokeWidth={3} />
                            </div>
                          </div>
                        );
                      })}

                      {/* Load More Button */}
                      {nextCursor && (
                        <button
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="w-full py-4 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-50"
                        >
                          {loadingMore ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                          {loadingMore ? 'Loading...' : 'Load More'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* R-03: Create Custom Exercise */}
            <div className="shrink-0 px-4 pb-3 border-t border-zinc-900 pt-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-zinc-800 hover:border-brand-primary/40 text-zinc-600 hover:text-brand-primary text-[11px] font-mono font-bold uppercase tracking-widest transition-all rounded-[2px]"
              >
                <PenLine size={12} /> Create Custom Exercise
              </button>
            </div>

            {/* Floating Action Button */}
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  exit={{ y: 100 }}
                  className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-12 pb-safe z-20"
                >
                  <button
                    onClick={handleConfirm}
                    className="w-full bg-white text-black font-black py-4 rounded-xl shadow-glow active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                  >
                    <Plus size={20} className="text-black" />
                    ADD {selectedIds.length} EXERCISES
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}

    {/* R-03: Create Custom Exercise modal */}
    <AnimatePresence>
      {showCreateModal && (
        <CreateExerciseModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(exercise) => {
            setResults(prev => [exercise, ...prev]);
            setSelectedIds(prev => [...prev, exercise.id]);
            setShowCreateModal(false);
          }}
        />
      )}
    </AnimatePresence>
    </>
  );
};

export default ExercisePicker;
