import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Table2, Sparkles, ChevronRight, Loader2, CheckCircle2, Dumbbell, RefreshCw } from 'lucide-react';
import { buildRoutineFromTable, ParsedDay } from '../../services/AIService';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useUIStore } from '../../store/useUIStore';

const EXAMPLE_TEXT = `Segunda: peito + tríceps 4x10
Terça: costas + bíceps 3x12
Quarta: descanso
Quinta: pernas 4x8
Sexta: ombros + core 3x15`;

interface Props {
    onClose: () => void;
}

const MuscleChip: React.FC<{ muscle: string }> = ({ muscle }) => (
    <span className="px-2 py-0.5 bg-zinc-800 rounded-lg text-caption-xs font-medium text-zinc-400 capitalize">
        {muscle}
    </span>
);

const RoutineTableBuilder: React.FC<Props> = ({ onClose }) => {
    const { saveRoutine, userStats } = useWorkoutStore();
    const { addNotification } = useUIStore();

    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ days: ParsedDay[]; message: string; source: 'local' | 'ai' } | null>(null);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [allSaved, setAllSaved] = useState(false);

    const hasApiKey = Boolean(userStats.geminiApiKey);

    const handleProcess = async () => {
        if (!input.trim()) return;
        setIsProcessing(true);
        setResult(null);
        setSavedIds(new Set());
        setAllSaved(false);

        try {
            const res = await buildRoutineFromTable(input.trim());
            setResult(res);
        } catch {
            setResult({ days: [], message: 'Error processing. Check the format and try again.', source: 'local' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveOne = (day: ParsedDay) => {
        saveRoutine(day.routine);
        setSavedIds(prev => new Set([...prev, day.routine.id]));
    };

    const handleSaveAll = () => {
        if (!result) return;
        result.days.forEach(d => saveRoutine(d.routine));
        setSavedIds(new Set(result.days.map(d => d.routine.id)));
        setAllSaved(true);
        addNotification(`${result.days.length} routines added to your plan!`, 'success');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col pt-safe">
            {/* Header */}
            <div
                className="shrink-0 px-5 pb-4 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between"
                style={{ paddingTop: `calc(var(--sat) + 1.25rem)` }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center border border-brand-primary/20">
                        <Table2 size={16} className="text-brand-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-medium">
                            Table Builder
                        </h2>
                        <div className="text-caption-xs text-zinc-500 font-medium flex items-center gap-1">
                            {hasApiKey ? (
                                <><Sparkles size={8} className="text-brand-primary" /> AI Enhanced</>
                            ) : (
                                'Deterministic Parser'
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-900 transition-colors tap"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">

                {/* Input */}
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-caption-xs font-bold text-zinc-500 uppercase tracking-widest">
                            Weekly Schedule
                        </span>
                        <button
                            onClick={() => setInput(EXAMPLE_TEXT)}
                            className="text-caption-xs font-medium text-zinc-600 hover:text-brand-primary transition-colors"
                        >
                            Load example
                        </button>
                    </div>

                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={EXAMPLE_TEXT}
                        rows={7}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white p-4 rounded-lg focus:outline-none focus:border-brand-primary/50 transition-colors font-medium text-sm placeholder:text-zinc-700 resize-none"
                    />

                    <p className="text-caption-xs font-medium text-zinc-600 mt-1.5 leading-relaxed">
                        One day per line. Format: <span className="text-zinc-400">Dia: músculo + músculo SxR</span>
                        &nbsp;— e.g. "Segunda: peito + tríceps 4x10"
                    </p>
                </section>

                {/* Action */}
                <button
                    onClick={handleProcess}
                    disabled={!input.trim() || isProcessing}
                    className="w-full py-4 bg-brand-primary text-black font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale transition-all rounded-lg tap"
                >
                    {isProcessing ? (
                        <><Loader2 size={14} className="animate-spin" /> Parsing…</>
                    ) : (
                        <><Table2 size={14} /> Build Routines</>
                    )}
                </button>

                {/* Results */}
                <AnimatePresence>
                    {result && (
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {/* Status bar */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${result.source === 'ai' ? 'bg-brand-primary' : 'bg-blue-400'}`} />
                                    <span className="text-caption-xs font-medium text-zinc-500">
                                        {result.source === 'ai' ? 'AI Parser' : 'Local Parser'} · {result.message}
                                    </span>
                                </div>
                                <button
                                    onClick={handleProcess}
                                    className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors tap"
                                    title="Re-parse"
                                >
                                    <RefreshCw size={12} />
                                </button>
                            </div>

                            {result.days.length === 0 ? (
                                <div className="p-6 border border-zinc-800 rounded-lg text-center">
                                    <p className="text-zinc-500 text-sm font-medium">No days detected.</p>
                                    <p className="text-zinc-700 text-xs font-medium mt-1">
                                        Try format: "Segunda: peito + tríceps 4x10"
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Day cards */}
                                    {result.days.map(day => {
                                        const isSaved = savedIds.has(day.routine.id);
                                        return (
                                            <motion.div
                                                key={day.routine.id}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`border rounded-lg overflow-hidden transition-all ${
                                                    isSaved ? 'border-brand-success/40 bg-brand-success/5' : 'border-zinc-800 bg-zinc-950'
                                                }`}
                                            >
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-white font-medium">
                                                                {day.dayName}
                                                            </h4>
                                                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                                {day.muscles.map(m => (
                                                                    <MuscleChip key={m} muscle={m} />
                                                                ))}
                                                                <span className="text-caption-xs font-medium text-zinc-600 ml-1">
                                                                    {day.setsPerExercise}×{day.repsTarget}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isSaved ? (
                                                            <CheckCircle2 size={16} className="text-brand-success shrink-0 mt-0.5" />
                                                        ) : (
                                                            <button
                                                                onClick={() => handleSaveOne(day)}
                                                                className="shrink-0 px-3 py-1.5 border border-zinc-700 text-zinc-400 text-caption-xs font-bold uppercase rounded-lg hover:border-brand-primary hover:text-brand-primary transition-all"
                                                            >
                                                                Save
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Exercise list preview */}
                                                    <div className="space-y-1 mt-3">
                                                        {(day.routine.blocks ?? []).slice(0, 4).map(block => (
                                                            <div key={block.id} className="flex items-center gap-2">
                                                                <Dumbbell size={9} className="text-zinc-600 shrink-0" />
                                                                <span className="text-caption-xs font-medium text-zinc-500 truncate">
                                                                    {block.sets.length}× Exercise
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {(day.routine.blocks?.length ?? 0) > 4 && (
                                                            <span className="text-caption-xs font-medium text-zinc-700">
                                                                +{(day.routine.blocks?.length ?? 0) - 4} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {/* Save all */}
                                    {!allSaved && result.days.length > 1 && (
                                        <button
                                            onClick={handleSaveAll}
                                            className="w-full py-4 flex items-center justify-center gap-2 bg-brand-primary text-black font-bold uppercase text-xs tracking-widest rounded-lg hover:bg-brand-accent transition-all tap"
                                        >
                                            <CheckCircle2 size={14} />
                                            Save All {result.days.length} Routines
                                            <ChevronRight size={14} />
                                        </button>
                                    )}

                                    {allSaved && (
                                        <motion.div
                                            initial={{ scale: 0.95 }}
                                            animate={{ scale: 1 }}
                                            className="p-4 border border-brand-success/30 bg-brand-success/5 rounded-lg text-center"
                                        >
                                            <CheckCircle2 size={20} className="text-brand-success mx-auto mb-2" />
                                            <p className="text-sm font-bold text-white font-medium">All routines saved!</p>
                                            <p className="text-caption-xs font-medium text-zinc-500 mt-1">
                                                Find them in My Routines.
                                            </p>
                                            <button
                                                onClick={onClose}
                                                className="mt-3 px-4 py-2 text-caption-xs font-bold uppercase text-brand-primary border border-brand-primary/30 rounded-lg hover:bg-brand-primary/10 transition-all tap"
                                            >
                                                Close
                                            </button>
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-zinc-900 bg-zinc-950">
                <div className="flex justify-between items-center text-caption-xs font-medium text-zinc-700 uppercase tracking-widest">
                    <span>Protocol: TableParser_v2.0</span>
                    <span>{hasApiKey ? 'AI · Gemini 1.5 Flash' : 'Local Engine'}</span>
                </div>
            </div>
        </div>
    );
};

export default RoutineTableBuilder;
