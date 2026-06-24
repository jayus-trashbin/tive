import React, { lazy, Suspense, useMemo, useState } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useActiveSessions } from '../store/selectors';
import { startOfDay, endOfDay } from '../utils/date';
import { Dumbbell, Filter } from 'lucide-react';
import { EmptyState } from './ui';
import { Page } from './ui/Page';
import { AnimatePresence } from 'framer-motion';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { useTranslation } from '../i18n';
import {
    HistoryHeader,
    SessionCard,
    SessionDetailsModal,
    CalendarModal
} from './history';

const AnalyticsDashboard = lazy(() => import('./analytics/AnalyticsDashboard'));

const AnalyticsFallback = () => (
    <div className="flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
);

/**
 * History Log — Training Journal & Analytics
 * 
 * Features (Modularized):
 * - Dual view: Journal (list) | Analytics (charts)
 * - SessionDetailsModal & CalendarModal
 */
const HistoryLog: React.FC = () => {
    const history = useActiveSessions();
    const exercises = useWorkoutStore(s => s.exercises);
    const { t } = useTranslation();

    const [viewMode, setViewMode] = useState<'journal' | 'analytics'>('journal');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

            <Page className="flex-1 px-page">
                {viewMode === 'journal' ? (
                    filteredSessions.length === 0 ? (
                        <EmptyState
                            icon={searchQuery ? Filter : Dumbbell}
                            title={searchQuery ? t('historyLog.noMatchesTitle') : t('historyLog.emptyTitle')}
                            description={searchQuery ? t('historyLog.noMatchesDesc') : t('historyLog.emptyDesc')}
                            subtitle={searchQuery ? t('historyLog.filteredLabel') : undefined}
                            action={searchQuery ? {
                                label: "Clear Search",
                                onClick: () => setSearchQuery('')
                            } : {
                                label: t('historyLog.emptyAction'),
                                onClick: () => {
                                    // G-03: Action to create routine if empty
                                    import('../store/useUIStore').then(({ useUIStore }) => {
                                        useUIStore.getState().setRoutineEditorOpen(true);
                                    });
                                }
                            }}
                        />
                    ) : (
                        <div className="mt-4 flex-1 h-full w-full">
                            <List
                                height={window.innerHeight - 150} // Approximate height remaining
                                itemCount={filteredSessions.length}
                                itemSize={80} // Approx card height including gap
                                width="100%"
                                className="no-scrollbar"
                            >
                                {({ index, style }: ListChildComponentProps) => {
                                    const session = filteredSessions[index];
                                    return (
                                        <SessionCard 
                                            key={session.id} 
                                            session={session} 
                                            onClick={() => setSelectedSessionId(session.id)}
                                            style={style}
                                            isLatest={index === 0}
                                        />
                                    );
                                }}
                            </List>
                        </div>
                    )
                ) : (
                    <Suspense fallback={<AnalyticsFallback />}>
                        <AnalyticsDashboard />
                    </Suspense>
                )}
            </Page>

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
                        const dayStart = startOfDay(date.getTime());
                        const dayEnd = endOfDay(date.getTime());
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
