
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Scale, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';
import { Session, Exercise, UserStats } from '../../types';
import { calculateSymmetry, calculateWilks } from '../../utils/engine';

interface Props {
    history: Session[];
    exercises: Exercise[];
    userStats: UserStats;
}

export const ProfileStatsComponent: React.FC<Props> = ({ history, exercises, userStats }) => {
    // --- Analytics Logic ---
    const totalVolume = useMemo(() => history.reduce((acc, s) => acc + s.volumeLoad, 0), [history]);
    const totalWorkouts = history.length;

    const symmetryData = useMemo(() => {
        // Map array to Map for faster lookup in engine
        const exMap = new Map<string, any>(exercises.map(e => [e.id, e]));
        return calculateSymmetry(history, exMap);
    }, [history, exercises]);

    const calculatedWilks = useMemo(() => {
        let maxLift = 0;
        history.forEach(s => {
            s.sets.forEach(set => {
                if (set.estimated1RM > maxLift) maxLift = set.estimated1RM;
            })
        });
        return Math.round(calculateWilks(maxLift, userStats.bodyweight, userStats.gender));
    }, [history, userStats]);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-3xl">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                        <Scale size={16} />
                        <span className="text-[10px] font-bold uppercase">Workouts</span>
                    </div>
                    <div className="text-3xl font-black text-white">{totalWorkouts}</div>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-3xl">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                        <BarChart3 size={16} />
                        <span className="text-[10px] font-bold uppercase">Wilks Score</span>
                    </div>
                    <div className="text-3xl font-black text-white">{calculatedWilks > 0 ? calculatedWilks : '--'}</div>
                    {calculatedWilks > 0 && (() => {
                        const level =
                            calculatedWilks >= 400 ? { label: 'Elite', color: 'text-amber-400', pct: 100 } :
                            calculatedWilks >= 300 ? { label: 'Advanced', color: 'text-brand-primary', pct: 75 } :
                            calculatedWilks >= 200 ? { label: 'Intermediate', color: 'text-brand-success', pct: 50 } :
                            { label: 'Beginner', color: 'text-zinc-500', pct: 25 };
                        return (
                            <div className="mt-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${level.color}`}>
                                    {level.label}
                                </span>
                                <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-primary transition-all duration-500"
                                        style={{ width: `${level.pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })()}
                    {calculatedWilks === 0 && <div className="text-[10px] text-zinc-600">Points</div>}
                </div>
            </div>

            {/* Volume Tonnage */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Scale size={100} />
                </div>
                <span className="text-xs font-bold text-zinc-500 uppercase">Total Lifetime Volume</span>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-white mt-1 relative z-10">
                    {(totalVolume / 1000).toFixed(0)}k <span className="text-lg text-zinc-600 font-medium">kg</span>
                </div>
            </div>

            {/* Symmetry Radar Chart */}
            <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-3xl aspect-square relative">
                <span className="absolute top-6 left-6 text-xs font-bold text-zinc-500 uppercase z-10">Physique Balance</span>

                {history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="55%" outerRadius="65%" data={symmetryData}>
                            <PolarGrid stroke="#3f3f46" strokeOpacity={0.5} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold' }} />
                            <Radar
                                name="Volume Focus"
                                dataKey="A"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="#6366f1"
                                fillOpacity={0.4}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-xs font-bold">
                        NOT ENOUGH DATA
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export const ProfileStats = React.memo(ProfileStatsComponent);
