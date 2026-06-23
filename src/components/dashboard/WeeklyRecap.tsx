import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Activity, TrendingUp, Flame } from 'lucide-react';

import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useTranslation } from '../../i18n';
import { Button } from '../ui';
import { getSessionMuscleIntensity } from '../../utils/analytics';


export const WeeklyRecap: React.FC = () => {
    const { history, exercises, userStats, updateUserStats } = useWorkoutStore();
    const { t } = useTranslation();

    const [isVisible, setIsVisible] = useState(false);

    const {
        shouldShow,
        stats,
        lastMonday
    } = useMemo(() => {
        const now = new Date();
        const day = now.getDay();
        const isMonday = day === 1;

        if (!isMonday) {
            return { shouldShow: false, stats: null, lastMonday: 0 };
        }

        // Calculate the timestamp for this Monday at 00:00:00
        const thisMonday = new Date(now);
        thisMonday.setHours(0, 0, 0, 0);
        const thisMondayMs = thisMonday.getTime();

        // If we already showed the recap for this Monday, skip
        if (userStats.lastRecapShown) {
            const lastShownMs = new Date(userStats.lastRecapShown).getTime();
            if (lastShownMs >= thisMondayMs) {
                return { shouldShow: false, stats: null, lastMonday: 0 };
            }
        }


        // Calculate the previous week (Monday to Sunday)
        const lastWeekStart = new Date(thisMonday);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(thisMonday);
        lastWeekEnd.setMilliseconds(-1);

        const lastWeekSessions = history.filter(s => 
            s.isCompleted && 
            !s.deletedAt && 
            s.date >= lastWeekStart.getTime() && 
            s.date <= lastWeekEnd.getTime()
        );

        // Hide if no sessions
        if (lastWeekSessions.length === 0) {
            return { shouldShow: false, stats: null, lastMonday: thisMondayMs };
        }

        let volume = 0;
        let prs = 0;
        const muscleCounts: Record<string, number> = {};

        lastWeekSessions.forEach(session => {
            volume += session.volumeLoad;
            prs += session.sets.filter(s => s.isPR).length;
            
            const intensities = getSessionMuscleIntensity(session, exercises);
            intensities.forEach((intensity, muscle) => {
                if (intensity > 0) {
                    muscleCounts[muscle] = (muscleCounts[muscle] || 0) + intensity;
                }
            });

        });

        let topMuscle = '';
        let maxCount = 0;
        Object.entries(muscleCounts).forEach(([m, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topMuscle = m;
            }
        });

        return {
            shouldShow: true,
            lastMonday: thisMondayMs,
            stats: {
                count: lastWeekSessions.length,
                volume,
                prs,
                topMuscle
            }
        };
    }, [history, exercises, userStats.lastRecapShown]);


    useEffect(() => {
        if (shouldShow && stats) {
            // Slight delay to not interrupt immediate UI mount
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [shouldShow, stats, lastMonday, updateUserStats]);


    const handleDismiss = () => {
        setIsVisible(false);
        updateUserStats({ lastRecapShown: new Date(lastMonday).toISOString() });
    };


    return (
        <AnimatePresence>
            {isVisible && stats && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 pt-safe"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative"
                    >
                        {/* Background subtle glow */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-brand-primary/10 blur-3xl pointer-events-none" />
                        
                        <div className="p-6 pb-8 relative z-10 text-center">
                            <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-primary/30">
                                <Trophy size={32} className="text-brand-primary" />
                            </div>
                            
                            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                                {t('weeklyRecap.title')}
                            </h2>
                            <p className="text-zinc-400 text-sm mb-8">
                                {t('weeklyRecap.subtitle') || "Last week's performance"}
                            </p>


                            <div className="grid grid-cols-2 gap-3 mb-8">
                                <div className="bg-black/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col items-center justify-center">
                                    <Activity size={20} className="text-brand-primary mb-2" />
                                    <div className="text-xl font-bold text-white mb-0.5">{stats.count}</div>
                                    <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">{t('weeklyRecap.workoutsLabel') || 'Workouts'}</div>
                                </div>
                                <div className="bg-black/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col items-center justify-center">
                                    <TrendingUp size={20} className="text-brand-primary mb-2" />
                                    <div className="text-xl font-bold text-white mb-0.5">{stats.volume > 1000 ? (stats.volume / 1000).toFixed(1) + 'k' : stats.volume}</div>
                                    <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">{t('weeklyRecap.volumeLabel') || 'Volume (KG)'}</div>
                                </div>
                                <div className="bg-black/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col items-center justify-center">
                                    <Flame size={20} className="text-brand-primary mb-2" />
                                    <div className="text-xl font-bold text-white mb-0.5">{stats.prs}</div>
                                    <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">{t('weeklyRecap.prsLabel') || 'New PRs'}</div>
                                </div>
                                <div className="bg-black/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col items-center justify-center">
                                    <div className="text-2xl mb-1">💪</div>
                                    <div className="text-sm font-bold text-white mb-0.5 capitalize truncate w-full px-1">{stats.topMuscle || '-'}</div>
                                    <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">{t('weeklyRecap.topMuscleLabel') || 'Top Muscle'}</div>
                                </div>
                            </div>


                            <Button 
                                variant="primary" 
                                size="lg" 
                                className="w-full text-black font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(190,242,100,0.3)]"
                                onClick={handleDismiss}
                            >
                                {t('weeklyRecap.dismiss')}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
