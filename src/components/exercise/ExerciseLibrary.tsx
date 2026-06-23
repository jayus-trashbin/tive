
import React, { useEffect, useState } from 'react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getExercises } from '../../services/exerciseService';
import ExerciseCard from './ExerciseCard';
import ExerciseDetailModal from './ExerciseDetailModal';
import { Search, Loader2, Database, ChevronDown } from 'lucide-react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { Exercise } from '../../types';
import { useTranslation } from '../../i18n';
import EmptyState from '../ui/EmptyState';

interface Props {
  onSelect?: (exerciseId: string) => void;
}

const ExerciseLibrary: React.FC<Props> = ({ onSelect }) => {
  const { exercises: globalExercises, mergeExercises } = useWorkoutStore();
  const { t } = useTranslation();
  
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
            <h1 className="page-title mb-4">{t('exerciseLibrary.title')}</h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <input 
                  type="text" 
                  placeholder={t('exerciseLibrary.searchPlaceholder')}
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
          <div className="flex-1 w-full h-full relative" style={{ height: 'calc(100vh - 200px)' }}>
              {viewExercises.length > 0 ? (
                  <>
                      <List
                          height={window.innerHeight - 200}
                          itemCount={viewExercises.length + (nextCursor ? 1 : 0)}
                          itemSize={220} // Approximate height for aspect-[16/9] on mobile
                          width="100%"
                          className="no-scrollbar"
                      >
                          {({ index, style }: ListChildComponentProps) => {
                              if (index === viewExercises.length) {
                                  return (
                                      <div style={style} className="p-2">
                                          <button 
                                            onClick={handleLoadMore}
                                            disabled={loadingMore}
                                            className="w-full h-full bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-50"
                                          >
                                              {loadingMore ? <Loader2 className="animate-spin" size={16} /> : <ChevronDown size={16} />}
                                              {loadingMore ? t('exerciseLibrary.loading') : t('exerciseLibrary.loadMore')}
                                          </button>
                                      </div>
                                  );
                              }

                              const ex = viewExercises[index];
                              return (
                                  <div style={style} className="p-2">
                                      <ExerciseCard 
                                          exercise={ex} 
                                          onClick={() => onSelect ? onSelect(ex.id) : setDetailExercise(ex)}
                                          onInfoClick={() => setDetailExercise(ex)}
                                      />
                                  </div>
                              );
                          }}
                      </List>
                  </>
              ) : (
                  !loading && (
                      <EmptyState
                          icon={Search}
                          title={t('exerciseLibrary.noResults')}
                          description={"Try searching for another exercise"}
                          action={{
                              label: "Clear Search",
                              onClick: () => setSearch('')
                          }}

                      />
                  )
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
