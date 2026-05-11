import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { get1RMProgression } from '../../utils/analytics';
import { maleStandards, femaleStandards, getStandardLevel, LiftType } from '../../data/strengthStandards';

export const StrengthStandards: React.FC = () => {
    const history = useWorkoutStore(s => s.history);
    const exercises = useWorkoutStore(s => s.exercises);
    const userStats = useWorkoutStore(s => s.userStats);
    
    const data = useMemo(() => {
        const targetLifts: { name: string, type: LiftType }[] = [
            { name: 'Bench Press', type: 'Bench Press' },
            { name: 'Squat', type: 'Squat' },
            { name: 'Deadlift', type: 'Deadlift' },
            { name: 'Overhead Press', type: 'Overhead Press' },
            { name: 'Barbell Row', type: 'Barbell Row' }
        ];
        
        const bw = userStats.bodyweight || 75;
        const gender = userStats.gender || 'male';
        const standards = gender === 'female' ? femaleStandards : maleStandards;
        
        return targetLifts.map(lift => {
            // Find exercise ID that matches the lift name
            const ex = exercises.find(e => e.name.toLowerCase().includes(lift.name.toLowerCase()));
            let e1RM = 0;
            
            if (ex) {
                // Get best recent 1RM
                const progression = get1RMProgression(history, ex.id);
                if (progression.length > 0) {
                    // Take the max 1RM achieved recently
                    e1RM = Math.max(...progression.slice(-10).map(p => p.value));
                }
            }
            
            const ratio = e1RM / bw;
            const level = getStandardLevel(lift.type, gender, bw, e1RM);
            
            // Calculate a 0-100 score based on Elite being 100
            const eliteStd = standards['Elite'].find(s => s.lift === lift.type);
            const eliteMult = eliteStd ? eliteStd.multiplier : 2.0;
            
            const score = Math.min(100, Math.round((ratio / eliteMult) * 100));
            
            return {
                subject: lift.name,
                score: score || 5, // minimum 5 for visual
                level,
                ratio: ratio.toFixed(2),
                e1RM,
                fullMark: 100
            };
        });
    }, [history, exercises, userStats]);

    return (
        <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-1">Strength Standards</h3>
            <p className="text-sm text-white/50 mb-4">Seu nível comparado à população ({userStats.bodyweight}kg BW)</p>
            
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Score"
                            dataKey="score"
                            stroke="#818cf8"
                            fill="#818cf8"
                            fillOpacity={0.5}
                        />
                        <Tooltip 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-zinc-800 border border-white/10 p-3 rounded-lg shadow-xl">
                                            <p className="text-white font-bold">{data.subject}</p>
                                            <p className="text-indigo-400 text-sm mt-1">Level: {data.level}</p>
                                            <p className="text-white/70 text-sm">e1RM: {data.e1RM}kg</p>
                                            <p className="text-white/70 text-sm">Ratio: {data.ratio}x BW</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
                {data.map(d => (
                    <div key={d.subject} className="flex flex-col p-2 rounded-lg bg-black/20 border border-white/5">
                        <span className="text-xs text-white/50 text-center">{d.subject}</span>
                        <span className="text-sm font-medium text-white text-center">{d.level}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
