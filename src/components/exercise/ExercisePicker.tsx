
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, Plus, Loader2, ChevronDown, Dumbbell, PenLine } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getExercises } from '../../services/exerciseService';
import { Exercise } from '../../types';
import { cn } from '../../lib/utils';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import CreateExerciseModal from './CreateExerciseModal';
import { logger } from '../../utils/logger';
import { Modal, IconButton, Button } from '../ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exerciseIds: string[]) => void;
  multiSelect?: boolean;
  existingExerciseIds?: string[];
}

// OSS ExerciseDB bodyParts (exact lowercase values from the API):
// chest | back | shoulders | upper arms | lower arms | upper legs | lower legs | waist | cardio | neck
// "arms" and "core" are convenience aliases handled by getApiBodyParts()
const MUSCLE_FILTERS: { label: string; value: string }[] = [
  { label: 'All',        value: 'all' },
  { label: 'Chest',      value: 'chest' },
  { label: 'Back',       value: 'back' },
  { label: 'Shoulders',  value: 'shoulders' },
  { label: 'Arms',       value: 'arms' },       // → upper arms + lower arms
  { label: 'Legs',       value: 'upper legs' }, // → upper legs
  { label: 'Calves',     value: 'lower legs' }, // → lower legs
  { label: 'Core',       value: 'core' },       // → waist
  { label: 'Cardio',     value: 'cardio' },
  { label: 'Neck',       value: 'neck' },
];

/** Proxy external GIF URLs through wsrv.nl for reliable thumbnail loading */
const getThumbUrl = (ex: Exercise): string => {
  if (ex.staticImageUrl) return ex.staticImageUrl;
  if (ex.gifUrl) return `https://wsrv.nl/?url=${encodeURIComponent(ex.gifUrl)}&n=1&output=webp&w=96&q=75`;
  return '';
};

const ExercisePicker: React.FC<Props> = ({ isOpen, onClose, onSelect, multiSelect = true, existingExerciseIds = [] }) => {
  const { addExercise: cacheExercise } = useWorkoutStore();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const [results, setResults] = useState<Exercise[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
      logger.error('ExercisePicker', 'Failed to load exercises', e);
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
      logger.error('ExercisePicker', 'Load more failed', e);
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
      <Modal
        isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      position="bottom"
      className="top-8 max-w-lg mx-auto border-t border-zinc-800 rounded-t-3xl h-[calc(100vh-2rem)] max-h-none sm:max-h-[90vh]"
      bodyClassName="p-0 flex flex-col h-full overflow-hidden"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-3 p-4 bg-zinc-950 border-b border-white/5 z-10 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Add Exercise</h2>
            <IconButton
              icon={X}
              onClick={onClose}
              aria-label="Close"
              variant="ghost"
              size="sm"
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white"
            />
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
                  "whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border tap",
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
                    const isExisting = existingExerciseIds.includes(ex.id);
                    const isExpanded = expandedId === ex.id;
                    
                    return (
                      <div key={ex.id} className="flex flex-col mb-1">
                        <div
                          onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer active:scale-[0.99]",
                            isSelected
                              ? "bg-brand-primary/10 border-brand-primary"
                              : "bg-transparent border-transparent hover:bg-zinc-900",
                            isExisting && !isSelected ? "opacity-60" : ""
                          )}
                        >
                          <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0 border border-white/5">
                            <ImageWithFallback
                              src={getThumbUrl(ex)}
                              alt={ex.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className={cn("text-sm font-bold truncate", isSelected ? "text-brand-primary" : "text-white")}>
                              {ex.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-caption-xs text-zinc-500 uppercase font-bold tracking-wider">
                                {ex.targetMuscle}
                              </span>
                              {isExisting && (
                                <span className="text-caption-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  Added
                                </span>
                              )}
                            </div>
                          </div>
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(ex);
                            }}
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center border transition-all shrink-0",
                              isSelected
                                ? "bg-brand-primary border-brand-primary text-white"
                                : "border-zinc-700 text-transparent hover:border-zinc-500"
                            )}>
                            <Check size={16} strokeWidth={3} />
                          </div>
                        </div>
                        
                        {/* Expanded Preview Inline */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mx-2 mb-2 p-3 bg-zinc-900/50 rounded-lg border border-white/5 flex gap-3">
                                <div className="w-24 h-24 rounded bg-zinc-950 overflow-hidden shrink-0 border border-white/5">
                                  <ImageWithFallback src={ex.gifUrl || getThumbUrl(ex)} alt={ex.name} className="w-full h-full object-cover mix-blend-screen" />
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-2">
                                  {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
                                    <div>
                                      <span className="text-caption-xs text-zinc-500 uppercase font-bold tracking-wider">Secondary</span>
                                      <p className="text-xs text-zinc-300 capitalize">{ex.secondaryMuscles.join(', ')}</p>
                                    </div>
                                  )}
                                  {ex.equipment && (
                                    <div>
                                      <span className="text-caption-xs text-zinc-500 uppercase font-bold tracking-wider">Equipment</span>
                                      <p className="text-xs text-zinc-300 capitalize">{ex.equipment}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {/* Load More Button */}
                  {nextCursor && (
                    <Button
                      variant="secondary"
                      onClick={handleLoadMore}
                      loading={loadingMore}
                      iconLeft={ChevronDown}
                      className="w-full mt-2 font-bold uppercase tracking-widest text-xs h-12 rounded-xl"
                    >
                      Load More
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* R-03: Create Custom Exercise */}
        <div className="shrink-0 px-4 pb-3 border-t border-zinc-900 pt-3 bg-zinc-950 z-10">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-zinc-800 hover:border-brand-primary/40 text-zinc-600 hover:text-brand-primary text-caption font-bold uppercase tracking-widest transition-all rounded-lg tap"
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
              <Button
                variant="primary"
                onClick={handleConfirm}
                iconLeft={Plus}
                className="w-full bg-white hover:bg-zinc-100 text-black font-bold h-12 shadow-glow"
              >
                ADD {selectedIds.length} EXERCISES
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>

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
