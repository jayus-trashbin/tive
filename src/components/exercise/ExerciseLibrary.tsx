
import React, { useEffect, useState } from 'react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getExercises } from '../../services/exerciseService';
import ExerciseCard from './ExerciseCard';
import ExerciseDetailModal from './ExerciseDetailModal';
import { Search, Loader2, Database, ChevronDown } from 'lucide-react';
import { Exercise } from '../../types';

interface Props {
  onSelect: (exerciseId: string) => void;
}

const ExerciseLibrary: React.FC<Props> = ({ onSelect }) => {
  const { exercises: globalExercises, mergeExercises } = useWorkoutStore();
  
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [viewExercises, setViewExercises] = useState<Exercise[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Initial Load
  useEffect(() => {
    const loadInitial = async () => {
        setLoading(true);
        const result = await getExercises({});
        mergeExercises(result.data);
        setViewExercises(result.data);
        setNextCursor(result.nextCursor);
        setLoading(false);
    };
    loadInitial();
  }, []); 

  // Search Effect
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      if (debouncedSearch.trim().length > 0) {
        // Now using unified fetch which supports name search AND cursor
        const results = await getExercises({ search: debouncedSearch });
        mergeExercises(results.data); 
        setViewExercises(results.data);
        setNextCursor(results.nextCursor);
      } else {
        // Reset to initial fetch
        const result = await getExercises({});
        setViewExercises(result.data);
        setNextCursor(result.nextCursor);
      }
      setLoading(false);
    };

    // Only search if changed
    if (debouncedSearch !== '' || (debouncedSearch === '' && viewExercises.length === 0)) {
         performSearch();
    }
  }, [debouncedSearch]);

  const handleLoadMore = async () => {
      if (!nextCursor || loadingMore) return;
      
      setLoadingMore(true);
      // Pass search term to ensure pagination continues correctly for the current query
      const result = await getExercises({ 
          search: debouncedSearch,
          cursor: nextCursor 
      });
      
      if (result.data.length > 0) {
          const newSet = [...viewExercises, ...result.data];
          setViewExercises(newSet);
          mergeExercises(result.data);
          setNextCursor(result.nextCursor);
      } else {
          setNextCursor(null);
      }
      setLoadingMore(false);
  };

  return (
    <>
      <div className="pb-24 space-y-6">
        <header className="sticky top-0 bg-zinc-950/80 backdrop-blur-md pt-4 pb-2 z-10">
            <h1 className="text-3xl font-black text-white mb-4">LIBRARY</h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <input 
                  type="text" 
                  placeholder="Search (e.g. Bench Press)..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-primary transition-all shadow-lg"
              />
              {loading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="animate-spin text-brand-primary" size={20} />
                  </div>
              )}
            </div>
            {!loading && viewExercises.length > 0 && (
                <div className="flex items-center gap-2 mt-2 px-1">
                    <Database size={10} className="text-zinc-600" />
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                        {viewExercises.length} Exercises Loaded
                    </span>
                </div>
            )}
        </header>
        
        {loading && viewExercises.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 animate-pulse">
              {[1,2,3,4].map(i => (
                  <div key={i} className="aspect-[16/10] bg-zinc-900 rounded-3xl border border-white/5" />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-4">
              {viewExercises.map(ex => (
                  <ExerciseCard 
                      key={ex.id} 
                      exercise={ex} 
                      onClick={() => onSelect(ex.id)}
                      onInfoClick={() => setDetailExercise(ex)}
                  />
              ))}
              
              {/* Load More Button */}
              {nextCursor && (
                  <button 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full py-4 mt-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-50"
                  >
                      {loadingMore ? (
                          <Loader2 className="animate-spin" size={16} />
                      ) : (
                          <ChevronDown size={16} />
                      )}
                      {loadingMore ? 'Loading...' : 'Load More Exercises'}
                  </button>
              )}

              {viewExercises.length === 0 && !loading && (
                  <div className="text-center py-10 text-zinc-500">
                      No exercises found. Try a different search term.
                  </div>
              )}
          </div>
        )}
      </div>
      
      {/* Details Modal */}
      <ExerciseDetailModal 
          exercise={detailExercise} 
          onClose={() => setDetailExercise(null)} 
      />
    </>
  );
};

export default ExerciseLibrary;
