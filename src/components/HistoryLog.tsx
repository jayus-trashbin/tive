import React, { useMemo, useState } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Dumbbell, TrendingUp, BarChart3, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HistoryHeader,
    SessionCard,
    SessionDetailsModal,
    CalendarModal
} from './history';
import VolumeChart from './analytics/VolumeChart';
import MuscleRadar from './analytics/MuscleRadar';
import EmptyState from './ui/EmptyState';

/**
 * History Log — Training Journal & Analytics
 * 
 * Features (Modularized):
 * - Dual view: Journal (list) | Analytics (charts)
 * - SessionDetailsModal & CalendarModal
 */
const HistoryLog: React.FC = () => {
    const history = useWorkoutStore(s => s.history);
    const exercises = useWorkoutStore(s => s.exercises);

    const [viewMode, setViewMode] = useState<'journal' | 'analytics'>('journal');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [performanceRange, setPerformanceRange] = useState<'7D' | '30D' | '90D'>('30D');

    // Filter sessions
    const filteredSessions = useMemo(() => {
        if (!searchQuery.trim()) return history;
        const q = searchQuery.toLowerCase();
        return history.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.sets.some(set => {
                const ex = exercises.find(e => e.id === set.exerciseId);
                return ex?.name.toLowerCase().includes(q);
            })
        );
    }, [history, searchQuery, exercises]);

    const selectedSession = useMemo(() =>
        history.find(s => s.id === selectedSessionId) || null,
        [history, selectedSessionId]
    );

    return (
        <div className="flex flex-col h-full overflow-hidden bg-black">
            <HistoryHeader 
                viewMode={viewMode}
                setViewMode={setViewMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onShowCalendar={() => setShowCalendar(true)}
            />

            <div className="flex-1 overflow-y-auto px-5 pb-32 no-scrollbar scroll-smooth">
                {viewMode === 'journal' ? (
                    filteredSessions.length === 0 ? (
                        <EmptyState
                            icon={Dumbbell}
                            title={searchQuery ? 'No Matches' : 'Your Journey Starts Here'}
                            description={searchQuery ? 'Try a different search term' : 'Complete your first workout to see it logged here'}
                        />
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: { opacity: 0 },
                                show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                            }}
                            className="space-y-2 mt-4"
                        >
                            {filteredSessions.map((session) => (
                                <SessionCard 
                                    key={session.id} 
                                    session={session} 
                                    onClick={() => setSelectedSessionId(session.id)}
                                />
                            ))}
                        </motion.div>
                    )
                ) : (
                    <div className="space-y-6 mt-6">
                        {history.length > 0 ? (
                            <>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <div className="section-title flex items-center gap-2">
                                            <TrendingUp size={12} className="text-brand-primary" /> Volume Progression
                                        </div>
                                        <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-[4px]">
                                            {(['7D', '30D', '90D'] as const).map((r) => (
                                                <button
                                                    key={r}
                                                    onClick={() => setPerformanceRange(r)}
                                                    className={cn(
                                                        "px-2.5 py-1 text-[9px] font-mono font-bold transition-colors cursor-pointer rounded-[2px]",
                                                        performanceRange === r ? "bg-brand-primary text-black" : "text-zinc-500 hover:text-zinc-300"
                                                    )}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="card-elevated p-3 overflow-hidden">
                                        <VolumeChart days={performanceRange === '7D' ? 7 : performanceRange === '30D' ? 30 : 90} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="section-title px-1 flex items-center gap-2">
                                        <LayoutGrid size={12} className="text-brand-primary" /> Muscle Balance
                                    </div>
                                    <div className="card-elevated p-4 h-[280px]">
                                        <MuscleRadar />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <EmptyState
                                icon={BarChart3}
                                title="No Data Yet"
                                description="Complete workouts to unlock analytics"
                            />
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedSession && (
                    <SessionDetailsModal
                        session={selectedSession}
                        onClose={() => setSelectedSessionId(null)}
                    />
                )}
            </AnimatePresence>

            <CalendarModal
                isOpen={showCalendar}
                onClose={() => setShowCalendar(false)}
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                    setSelectedDate(date);
                    if (date) {
                        const dayStart = new Date(date).setHours(0, 0, 0, 0);
                        const dayEnd = new Date(date).setHours(23, 59, 59, 999);
                        const match = history.find(s => s.date >= dayStart && s.date <= dayEnd);
                        if (match) {
                            setShowCalendar(false);
                            setSelectedSessionId(match.id);
                        }
                    }
                }}
                sessions={history}
            />
        </div>
    );
};

export default HistoryLog;
