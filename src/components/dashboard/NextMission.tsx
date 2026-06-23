import React from 'react';
import { Target, Play, Dumbbell, Zap, Calendar, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Routine } from '../../types';
import { estimateRoutineDuration } from '../../utils/engine';
import { Button, EmptyState } from '../ui';
import { useTranslation } from '../../i18n';

interface NextMissionProps {
    nextRoutine: Routine | null;
    onStart: (id: string) => void;
}

export const NextMission: React.FC<NextMissionProps> = ({ nextRoutine, onStart }) => {
    if (!nextRoutine) return <EmptyMission />;

    return (
        <section className="shrink-0">
            <div className="section-title mb-3">
                <Target size={16} className="text-brand-primary" /> Up Next
            </div>

            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => onStart(nextRoutine.id)}
                className="card relative overflow-hidden cursor-pointer group border border-zinc-800 shadow-[0_4px_32px_-8px] shadow-brand-primary/10"
            >
                {/* Subtle Ambient Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

                <div className="p-5 flex justify-between items-center relative z-10">
                    <div className="space-y-3">
                        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-primary/15 border border-brand-primary/30 text-brand-primary text-xs font-medium">
                            Ready to Train
                        </div>
                        
                        <h3 className="text-2xl font-bold text-white tracking-tight">
                            {nextRoutine.name}
                        </h3>
                        
                        <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
                            <div className="flex items-center gap-1.5">
                                <Dumbbell size={14} />
                                {nextRoutine.exerciseIds.length} exercises
                            </div>
                            <div className="h-3 w-px bg-zinc-700" />
                            <div className="flex items-center gap-1.5">
                                <Zap size={14} />
                                ~{estimateRoutineDuration(nextRoutine)} min
                            </div>
                        </div>
                    </div>

                    <div className="w-12 h-12 bg-brand-primary text-black flex items-center justify-center rounded-full shadow-[0_0_20px_-4px] shadow-brand-primary/40 group-hover:scale-105 transition-transform duration-200 shrink-0">
                        <Play size={20} fill="black" className="ml-1" />
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

const EmptyMission: React.FC = () => {
    const { t } = useTranslation();
    return (
        <EmptyState
            icon={Calendar}
            title={t('dashboard.nextMissionEmptyTitle')}
            description={t('dashboard.nextMissionEmptyDesc')}
            action={{
                label: t('dashboard.nextMissionEmptyAction'),
                onClick: () => {
                    import('../../store/useUIStore').then(({ useUIStore }) => {
                        useUIStore.getState().setRoutineEditorOpen(true);
                    });
                },
                iconLeft: Plus
            }}
        />
    );
};

