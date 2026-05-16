import React from 'react';
import { Activity, TrendingUp, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricPillProps {
    icon: React.ElementType;
    value: string;
    label: string;
    accent?: string;
}

export const MetricPill: React.FC<MetricPillProps> = ({ icon: Icon, value, label, accent }) => (
    <div className="bg-zinc-900 rounded-xl p-4 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
            <Icon size={14} className={cn("text-zinc-500", accent)} />
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">{label}</span>
        </div>
        <div className="text-2xl font-black text-white leading-none">
            {value}
        </div>
    </div>
);

interface MetricStripProps {
    sessionCount: number;
    formattedVolume: string;
    /** Average session duration in minutes, or null when no data. */
    avgDurationMin: number | null;
    streakCard: React.ReactNode;
}

export const MetricStrip: React.FC<MetricStripProps> = ({
    sessionCount,
    formattedVolume,
    avgDurationMin,
    streakCard,
}) => (
    <section className="grid grid-cols-2 gap-2 shrink-0 w-full">
        {streakCard}
        <MetricPill icon={Activity} value={sessionCount.toString()} label="Sessions" />
        <MetricPill icon={TrendingUp} value={formattedVolume} label="Volume" accent="text-brand-primary" />
        {avgDurationMin !== null ? (
            <div className="bg-zinc-900 rounded-xl p-4 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={14} className="text-zinc-500" />
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Avg</span>
                </div>
                <div className="text-2xl font-black text-white leading-none">
                    {avgDurationMin}<span className="text-xs text-zinc-500 ml-0.5">m</span>
                </div>
            </div>
        ) : (
            <div className="bg-zinc-900/50 rounded-xl p-4 flex flex-col justify-center opacity-50">
                <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={14} className="text-zinc-500" />
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Avg</span>
                </div>
                <div className="text-2xl font-black text-white leading-none">
                    —
                </div>
            </div>
        )}
    </section>
);
