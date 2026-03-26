import React, { useState } from 'react';
import { BarChart3, Activity, Calendar, TrendingUp, Filter, Target } from 'lucide-react';
import { cn } from '../../lib/utils';
import VolumeChart from './VolumeChart';
import OneRMProgress from './OneRMProgress';
import FrequencyHeatmap from './FrequencyHeatmap';
import MuscleRadar from './MuscleRadar';
import PRTimeline from './PRTimeline';
import WeeklyMuscleComparison from './WeeklyMuscleComparison';

/**
 * Premium Analytics Dashboard
 * - Professional layout with sharp geometry
 * - Time range filters (7D, 30D, 90D)
 * - Collapsible sections
 * - Performance-first insights
 */
const AnalyticsDashboard: React.FC = () => {
    const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'ALL'>('30D');

    const ranges = [
        { id: '7D', label: '7D' },
        { id: '30D', label: '30D' },
        { id: '90D', label: '90D' },
        { id: 'ALL', label: 'ALL' },
    ];

    const getDaysFromRange = (range: string) => {
        if (range === 'ALL') return 365;
        return parseInt(range);
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto px-4 pt-safe pb-32 space-y-6 no-scrollbar scroll-smooth">
            {/* Header */}
            <header className="shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={16} className="text-brand-primary" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
                            Performance Insights
                        </span>
                    </div>

                    {/* Time Filter Pill */}
                    <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-[4px]">
                        {ranges.map((range) => (
                            <button
                                key={range.id}
                                onClick={() => setTimeRange(range.id as any)}
                                className={cn(
                                    "px-3 py-1 text-[9px] font-mono font-bold transition-colors cursor-pointer rounded-[2px]",
                                    timeRange === range.id
                                        ? "bg-brand-primary text-black"
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-baseline gap-3">
                    <h1 className="text-2xl font-black text-white tracking-tighter uppercase font-mono">
                        Analytics<span className="text-brand-primary">_</span>Lab
                    </h1>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="space-y-6">

                {/* 1. Primary Chart: Volume Analysis */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={12} className="text-brand-primary" /> Volume Progression
                        </h2>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-[4px] p-4">
                        <VolumeChart days={getDaysFromRange(timeRange)} />
                    </div>
                </section>

                {/* 2. Secondary Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <section>
                        <div className="flex items-center mb-3 px-1">
                            <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Filter size={12} className="text-brand-primary" /> 1RM Est. Progress
                            </h2>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[4px] p-4 h-[300px]">
                            <OneRMProgress />
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center mb-3 px-1">
                            <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Target size={12} className="text-brand-primary" /> Muscle Distribution
                            </h2>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[4px] p-4 h-[300px]">
                            <MuscleRadar />
                        </div>
                    </section>
                </div>

                {/* 3. Consistency: Frequency Heatmap */}
                <section>
                    <div className="flex items-center mb-3 px-1">
                        <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12} className="text-brand-primary" /> Training Frequency (Last 12 Weeks)
                        </h2>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-[4px] p-4">
                        <FrequencyHeatmap />
                    </div>
                </section>

                {/* 4. E-03: Weekly Muscle Volume Comparison */}
                <section>
                    <div className="flex items-center mb-3 px-1">
                        <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={12} className="text-brand-primary" /> Weekly Muscle Load
                        </h2>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-[4px] p-4">
                        <WeeklyMuscleComparison />
                    </div>
                </section>

                {/* 5. Recent PRs & Timeline */}
                <section>
                    <div className="flex items-center mb-3 px-1">
                        <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={12} className="text-brand-primary" /> PR Achievement Log
                        </h2>
                    </div>
                    <PRTimeline />
                </section>

                {/* Footer Sync Info */}
                <div className="py-8 text-center bg-zinc-950">
                    <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.3em]">
                        Systems Operational • Real-time Data Stream • v1.1
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
