import React, { useState, useRef } from 'react';
import { BarChart3, Activity, Calendar, TrendingUp, Filter, Target, Dumbbell, Download, Upload, Trophy, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import VolumeChart from './VolumeChart';
import OneRMProgress from './OneRMProgress';
import FrequencyHeatmap from './FrequencyHeatmap';
import MuscleRadar from './MuscleRadar';
import PRTimeline from './PRTimeline';
import WeeklyMuscleComparison from './WeeklyMuscleComparison';
import TopExercises from './TopExercises';
import ChartErrorBoundary from './ChartErrorBoundary';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { exportToCSV, downloadCSV, downloadJSON, parseBackupJSON } from '../../utils/exportImport';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Premium Analytics Dashboard — BLOCO 3 complete.
 * Sections: Volume, 1RM, Muscle Radar, Frequency Heatmap,
 *           Weekly Muscle Load, Top Exercises, PR Timeline.
 * Toolbar:  Export CSV / Export JSON / Import JSON.
 */
const AnalyticsDashboard: React.FC = () => {
    const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'ALL'>('30D');
    const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const history = useWorkoutStore(s => s.history);
    const exercises = useWorkoutStore(s => s.exercises);
    const userStats = useWorkoutStore(s => s.userStats);
    const addExercise = useWorkoutStore(s => s.addExercise);
    const mergeRemoteData = useWorkoutStore(s => s.mergeRemoteData);

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

    // A-06: Export CSV
    const handleExportCSV = () => {
        const csv = exportToCSV(history, exercises);
        const date = new Date().toISOString().split('T')[0];
        downloadCSV(csv, `tive-${userStats.name || 'export'}-${date}.csv`);
    };

    // A-06: Export JSON
    const handleExportJSON = () => {
        const backup = { history, exercises, userStats };
        const date = new Date().toISOString().split('T')[0];
        downloadJSON(backup, `tive-backup-${date}.json`);
    };

    // A-07: Import JSON
    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const result = parseBackupJSON(text);
            if (result.error) {
                setImportMsg({ type: 'error', text: result.error });
            } else {
                // Merge sessions and exercises using the existing store action
                const newSessions = result.sessions.filter(s => !history.find(h => h.id === s.id));
                mergeRemoteData(newSessions, [], result.exercises);
                setImportMsg({ type: 'success', text: `Imported ${newSessions.length} new sessions & ${result.exercises.length} exercises.` });
            }
            setTimeout(() => setImportMsg(null), 4000);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
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

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-black text-white tracking-tighter uppercase font-mono">
                        Analytics<span className="text-brand-primary">_</span>Lab
                    </h1>

                    {/* A-06/A-07: Export/Import toolbar */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleExportCSV}
                            title="Export as CSV"
                            className="flex items-center gap-1 px-2 py-1.5 text-[9px] font-bold text-zinc-500 hover:text-brand-primary border border-zinc-800 hover:border-brand-primary/30 rounded-[3px] transition-all bg-zinc-900"
                        >
                            <Download size={10} /> CSV
                        </button>
                        <button
                            onClick={handleExportJSON}
                            title="Export backup JSON"
                            className="flex items-center gap-1 px-2 py-1.5 text-[9px] font-bold text-zinc-500 hover:text-brand-primary border border-zinc-800 hover:border-brand-primary/30 rounded-[3px] transition-all bg-zinc-900"
                        >
                            <Download size={10} /> JSON
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            title="Import backup JSON"
                            className="flex items-center gap-1 px-2 py-1.5 text-[9px] font-bold text-zinc-500 hover:text-amber-400 border border-zinc-800 hover:border-amber-400/30 rounded-[3px] transition-all bg-zinc-900"
                        >
                            <Upload size={10} /> Import
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleImportJSON}
                        />
                    </div>
                </div>

                {/* Import feedback toast */}
                <AnimatePresence>
                    {importMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className={cn(
                                "mt-2 flex items-center gap-2 px-3 py-2 rounded-[3px] border text-[10px] font-bold",
                                importMsg.type === 'success'
                                    ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                            )}
                        >
                            <AlertCircle size={12} />
                            {importMsg.text}
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Content */}
            <div className="space-y-6">

                {/* 1. Volume Analysis */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={12} className="text-brand-primary" /> Volume Progression
                        </h2>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-[4px] p-4">
                        <ChartErrorBoundary>
                            <VolumeChart days={getDaysFromRange(timeRange)} />
                        </ChartErrorBoundary>
                    </div>
                </section>

                {/* 2. 1RM + Muscle Radar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <section>
                        <div className="flex items-center mb-3 px-1">
                            <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Filter size={12} className="text-brand-primary" /> 1RM Est. Progress
                            </h2>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[4px] p-4 h-[300px]">
                            <ChartErrorBoundary>
                                <OneRMProgress />
                            </ChartErrorBoundary>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center mb-3 px-1">
                            <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Target size={12} className="text-brand-primary" /> Muscle Distribution
                            </h2>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[4px] p-4 h-[300px]">
                            <ChartErrorBoundary>
                                <MuscleRadar />
                            </ChartErrorBoundary>
                        </div>
                    </section>
                </div>

                {/* 3. A-05: Frequency Heatmap with drill-down */}
                <section>
                    <div className="flex items-center mb-3 px-1">
                        <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12} className="text-brand-primary" /> Training Frequency (90 Days)
                        </h2>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-[4px] p-4">
                        <ChartErrorBoundary>
                            <FrequencyHeatmap />
                        </ChartErrorBoundary>
                    </div>
                </section>

                {/* 4. E-03: Weekly Muscle Volume */}
                <section>
                    <div className="flex items-center mb-3 px-1">
                        <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={12} className="text-brand-primary" /> Weekly Muscle Load
                        </h2>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-[4px] p-4">
                        <ChartErrorBoundary>
                            <WeeklyMuscleComparison />
                        </ChartErrorBoundary>
                    </div>
                </section>

                {/* 5. A-04: Top Exercises */}
                <section>
                    <div className="flex items-center mb-3 px-1">
                        <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Dumbbell size={12} className="text-brand-primary" /> Top Exercises
                        </h2>
                    </div>
                    <ChartErrorBoundary>
                        <TopExercises limit={8} />
                    </ChartErrorBoundary>
                </section>

                {/* 6. A-08: PR Timeline with filter */}
                <section>
                    <div className="flex items-center mb-3 px-1">
                        <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Trophy size={12} className="text-brand-primary" /> PR Achievement Log
                        </h2>
                    </div>
                    <ChartErrorBoundary>
                        <PRTimeline />
                    </ChartErrorBoundary>
                </section>

                {/* Footer */}
                <div className="py-8 text-center bg-zinc-950">
                    <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.3em]">
                        Systems Operational • Real-time Data Stream • v1.2
                    </p>
                </div>
            </div>
        </div>
    );
};

export default React.memo(AnalyticsDashboard);
