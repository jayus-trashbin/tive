import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { get1RMProgression } from '../../utils/analytics';
import { maleStandards, femaleStandards, getStandardLevel, LiftType } from '../../data/strengthStandards';
import { cn } from '../../lib/utils';

const LEVEL_COLOR: Record<string, string> = {
    Elite: 'text-yellow-400',
    Advanced: 'text-brand-primary',
    Intermediate: 'text-blue-400',
    Novice: 'text-zinc-300',
    Beginner: 'text-orange-400',
    Untrained: 'text-zinc-600',
};

const ALL_LIFTS: { name: string; type: LiftType }[] = [
    { name: 'Bench Press',       type: 'Bench Press' },
    { name: 'Squat',             type: 'Squat' },
    { name: 'Deadlift',          type: 'Deadlift' },
    { name: 'Overhead Press',    type: 'Overhead Press' },
    { name: 'Barbell Row',       type: 'Barbell Row' },
    { name: 'Romanian Deadlift', type: 'Romanian Deadlift' },
    { name: 'Pull-up',           type: 'Pull-up' },
    { name: 'Dumbbell Press',    type: 'Dumbbell Press' },
];

// Show only 5 lifts on the radar to avoid axis crowding; grid below shows all.
const RADAR_LIFTS: LiftType[] = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row'];

export const StrengthStandards: React.FC = () => {
    const history = useWorkoutStore(s => s.history);
    const exercises = useWorkoutStore(s => s.exercises);
    const userStats = useWorkoutStore(s => s.userStats);

    const allData = useMemo(() => {
        const bw = userStats.bodyweight || 75;
        const gender = userStats.gender || 'male';
        const standards = gender === 'female' ? femaleStandards : maleStandards;

        return ALL_LIFTS.map(lift => {
            const ex = exercises.find(e =>
                e.name.toLowerCase().includes(lift.name.toLowerCase())
            );
            let e1RM = 0;
            if (ex) {
                const progression = get1RMProgression(history, ex.id);
                if (progression.length > 0) {
                    e1RM = Math.max(...progression.slice(-10).map(p => p.value));
                }
            }

            const ratio = e1RM / bw;
            const level = getStandardLevel(lift.type, gender, bw, e1RM);
            const eliteMult = standards['Elite'].find(s => s.lift === lift.type)?.multiplier ?? 2.0;
            const score = Math.min(100, Math.round((ratio / eliteMult) * 100));

            return {
                subject: lift.name,
                type: lift.type,
                score: score || 5,
                level,
                ratio: ratio.toFixed(2),
                e1RM,
                fullMark: 100,
                hasData: e1RM > 0,
            };
        });
    }, [history, exercises, userStats]);

    const radarData = useMemo(
        () => allData.filter(d => RADAR_LIFTS.includes(d.type as LiftType)),
        [allData]
    );

    const weakest = useMemo(() => {
        const withData = allData.filter(d => d.hasData);
        if (withData.length < 2) return null;
        return withData.reduce((min, d) => d.score < min.score ? d : min, withData[0]);
    }, [allData]);

    return (
        <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5 space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-white">Strength Standards</h3>
                <p className="text-sm text-white/50">
                    Seu nível comparado à população ({userStats.bodyweight}kg BW)
                </p>
            </div>

            {/* Weakest lift callout */}
            {weakest && (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <AlertTriangle size={14} className="text-orange-400 shrink-0" />
                    <div>
                        <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Focus Area</p>
                        <p className="text-xs text-zinc-300">
                            <span className="font-bold text-white">{weakest.subject}</span> is your weakest lift — {weakest.level}
                        </p>
                    </div>
                </div>
            )}

            {/* Radar (top 5 core lifts) */}
            <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Score"
                            dataKey="score"
                            stroke="#a3e635"
                            fill="#a3e635"
                            fillOpacity={0.25}
                            strokeWidth={2}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-2xl">
                                        <p className="text-white font-bold text-sm">{d.subject}</p>
                                        <p className={cn('text-xs font-bold mt-0.5', LEVEL_COLOR[d.level])}>{d.level}</p>
                                        <p className="text-zinc-500 text-[10px] mt-1">e1RM: {d.e1RM} kg · {d.ratio}× BW</p>
                                    </div>
                                );
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Full grid — all 8 lifts */}
            <div className="grid grid-cols-2 gap-2">
                {allData.map(d => (
                    <div
                        key={d.subject}
                        className={cn(
                            'flex flex-col p-2.5 rounded-xl border',
                            d === weakest
                                ? 'border-orange-500/30 bg-orange-500/5'
                                : 'border-white/5 bg-black/20'
                        )}
                    >
                        <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider truncate">
                            {d.subject}
                        </span>
                        <span className={cn('text-sm font-bold mt-0.5', LEVEL_COLOR[d.level])}>
                            {d.level}
                        </span>
                        {d.hasData && (
                            <span className="text-[9px] text-zinc-600 mt-0.5">{d.e1RM} kg</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
