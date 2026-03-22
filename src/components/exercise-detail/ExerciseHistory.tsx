import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, History, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface HistoryLog {
    date: number;
    weight: number;
    reps: number;
    rpe: number;
    '1rm': number;
}

interface Props {
    history: HistoryLog[];
}

export const ExerciseHistory: React.FC<Props> = ({ history }) => {
    return (
        <motion.div
            key="history"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            {history.length > 1 && (
                <div className="bg-zinc-900 border border-white/5 rounded-[2rem] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={14} className="text-brand-primary" />
                        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">1RM Progression</span>
                    </div>
                    <div className="h-[150px] -ml-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history.slice().reverse()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    hide
                                />
                                <YAxis
                                    domain={['auto', 'auto']}
                                    hide
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-zinc-950 border border-zinc-800 p-2 font-mono shadow-xl">
                                                    <p className="text-[10px] text-zinc-500 uppercase">{new Date(payload[0].payload.date).toLocaleDateString()}</p>
                                                    <p className="text-brand-primary font-black">{payload[0].value} kg</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="1rm"
                                    stroke="#a3e635"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#a3e635', strokeWidth: 2, stroke: '#09090b' }}
                                    activeDot={{ r: 6, fill: '#a3e635', strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {history.length > 0 ? (
                <div className="space-y-3">
                    {history.map((log, i) => (
                        <div key={i} className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-white/10 transition-colors">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} className="text-zinc-500" />
                                    <span className="text-xs font-bold text-zinc-400">
                                        {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1 text-white font-black text-xl group-hover:text-brand-primary transition-colors">
                                    {log.weight} <span className="text-xs text-zinc-500 font-bold uppercase">kg</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-[9px] text-zinc-500 font-bold uppercase mb-0.5">Reps</div>
                                    <div className="text-white font-bold font-mono text-lg leading-none">{log.reps}</div>
                                </div>
                                <div className="w-px h-8 bg-zinc-800" />
                                <div className="text-right">
                                    <div className="text-[9px] text-zinc-500 font-bold uppercase mb-0.5">Est. 1RM</div>
                                    <div className="text-brand-primary font-bold font-mono text-lg leading-none">{log['1rm']}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 rounded-[2rem] border border-dashed border-zinc-800">
                    <History size={48} className="text-zinc-700 mb-4" />
                    <p className="text-zinc-400 font-bold text-sm">No history recorded yet.</p>
                    <p className="text-zinc-600 text-xs mt-1">Complete a set to see it here.</p>
                </div>
            )}
        </motion.div>
    );
};
