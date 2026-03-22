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
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-[4px] px-4 py-3 min-w-[110px] flex-1">
        <Icon size={16} className={cn("text-zinc-500 shrink-0", accent)} />
        <div className="min-w-0">
            <div className="text-lg font-heading font-black text-white leading-none tracking-tight">
                {value}
            </div>
            <div className="data-label mt-0.5">{label}</div>
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
