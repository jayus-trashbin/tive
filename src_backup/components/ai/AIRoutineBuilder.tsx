import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Dumbbell, FileText, Clipboard, Loader2 } from 'lucide-react';
import { generateRoutine } from '@/services/AIService';
import { Routine } from '../../types';

interface AIRoutineBuilderProps {
    onClose: () => void;
    onImport: (routine: Routine) => void;
}

const AIRoutineBuilder: React.FC<AIRoutineBuilderProps> = ({ onClose, onImport }) => {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedRoutine, setGeneratedRoutine] = useState<Routine | null>(null);
    const [aiMessage, setAiMessage] = useState<string | null>(null);

    const handleProcess = async () => {
        if (!input.trim()) return;

        setIsProcessing(true);
        setGeneratedRoutine(null);
        setAiMessage(null);

        try {
            const response = await generateRoutine(input);
            setGeneratedRoutine(response.routine || null);
            setAiMessage(response.message || null);
        } catch (error) {
            setAiMessage("Error processing data. Please check your input format.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col pt-safe">
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center border border-brand-primary/20">
                        <Sparkles size={16} className="text-brand-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">AI Architect</h2>
                        <div className="text-[10px] text-zinc-500 font-mono">Data Processing Unit</div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-900 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-8">
                {/* Introduction */}
                <section>
                    <div className="flex items-center gap-2 mb-2">
                        <Clipboard size={14} className="text-brand-primary" />
                        <h3 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">Input Stream</h3>
                    </div>
                    <p className="text-xs text-zinc-600 font-mono leading-relaxed mb-4">
                        Paste your workout plan, exercise table, or routine description below.
                        Our AI will extract the structure and generate a compatible Tive routine.
                    </p>

                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Drop your routine data here..."
                            className="w-full h-64 bg-zinc-900/50 border border-zinc-800 text-white p-5 rounded-[2px] focus:outline-none focus:border-brand-primary/50 transition-colors font-mono text-sm placeholder:text-zinc-800 resize-none"
                        />
                        <div className="absolute bottom-4 right-4 flex gap-2">
                            <button
                                onClick={handleProcess}
                                disabled={!input.trim() || isProcessing}
                                className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-black font-black uppercase text-xs rounded-[2px] disabled:opacity-30 disabled:grayscale transition-all hover:scale-[1.02] active:scale-95 shadow-tech"
                            >
                                {isProcessing ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <FileText size={14} />
                                )}
                                Process Routine
                            </button>
                        </div>
                    </div>
                </section>

                {/* Results Section */}
                <AnimatePresence>
                    {(isProcessing || generatedRoutine || aiMessage) && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={14} className="text-brand-primary" />
                                <h3 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">Output Feed</h3>
                            </div>

                            {isProcessing ? (
                                <div className="border border-zinc-900 p-10 flex flex-col items-center justify-center gap-4">
                                    <div className="w-12 h-1 bg-zinc-800 overflow-hidden relative">
                                        <motion.div
                                            className="absolute inset-0 bg-brand-primary"
                                            animate={{ x: ['-100%', '100%'] }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest animate-pulse">Analysing structure...</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {aiMessage && (
                                        <div className="p-4 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono leading-relaxed italic">
                                            {aiMessage}
                                        </div>
                                    )}

                                    {generatedRoutine && (
                                        <motion.div
                                            initial={{ scale: 0.98 }}
                                            animate={{ scale: 1 }}
                                            className="bg-zinc-950 border-2 border-brand-primary/20 rounded-[2px] overflow-hidden"
                                        >
                                            <div className="p-5 border-b border-zinc-900 bg-brand-primary/5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">{generatedRoutine.name}</h4>
                                                    <span className="px-2 py-0.5 bg-brand-primary text-black text-[9px] font-black uppercase rounded-[2px]">AI Generated</span>
                                                </div>
                                                <div className="flex items-center gap-4 font-mono text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5"><Dumbbell size={12} className="text-brand-primary" /> {generatedRoutine.exerciseIds.length} Exercises</span>
                                                    <span>•</span>
                                                    <span>Synced with library</span>
                                                </div>
                                            </div>

                                            <div className="p-2">
                                                <button
                                                    onClick={() => onImport(generatedRoutine)}
                                                    className="w-full py-4 bg-brand-primary text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-brand-accent transition-all shadow-tech"
                                                >
                                                    Import to My Routines <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer / Meta */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950 shrink-0">
                <div className="flex justify-between items-center text-[8px] font-mono text-zinc-700 uppercase tracking-widest">
                    <span>Protocol: RoutineExtract_v1.0</span>
                    <span>Status: Healthy</span>
                </div>
            </div>
        </div>
    );
};

export default AIRoutineBuilder;
