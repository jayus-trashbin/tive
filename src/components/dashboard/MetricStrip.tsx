import React from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricPillProps {
    icon: React.ElementType;
    value: string;
    label: string;
    accent?: string;
}

export const MetricPill: React.FC<MetricPillProps> = ({ icon: Icon, value, label, accent }) => (
    <div className="card px-4 py-3 min-w-[110px] flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
            <Icon size={14} className={cn("text-zinc-500", accent)} />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-xl font-bold text-white leading-none">
            {value}
        </div>
    </div>
);

interface MetricStripProps {
    sessionCount: number;
    formattedVolume: string;
    streakCard: React.ReactNode;
}

export const MetricStrip: React.FC<MetricStripProps> = ({ sessionCount, formattedVolume, streakCard }) => (
    <section className="flex gap-2 shrink-0 overflow-x-auto no-scrollbar -mx-1 px-1 items-stretch">
        {streakCard}
        <div className="flex flex-col gap-2 flex-1">
            <MetricPill icon={Activity} value={sessionCount.toString()} label="Sessions" />
            <MetricPill icon={TrendingUp} value={formattedVolume} label="Volume" accent="text-brand-primary" />
        </div>
    </section>
);
