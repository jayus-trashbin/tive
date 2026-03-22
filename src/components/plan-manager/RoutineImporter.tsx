import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileJson, BookTemplate, History, Upload, Check, AlertTriangle } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { Routine } from '../../types/domain';
import { cn } from '../../lib/utils';

interface RoutineImporterProps {
    isOpen: boolean;
    onClose: () => void;
    onImported?: (routine: Routine) => void;
}

type ImportTab = 'json' | 'templates' | 'history';

// Built-in routine templates (exerciseIds only — blocks can be configured later in editor)
const TEMPLATES: { name: string; category: string; exerciseIds: string[]; exerciseCount: number }[] = [
    {
        name: 'PPL — Push Day',
        category: 'Push Pull Legs',
        exerciseIds: ['0025', '0047', '0334', '0405', '0285'],
        exerciseCount: 5,
    },
    {
        name: 'PPL — Pull Day',
        category: 'Push Pull Legs',
        exerciseIds: ['0027', '0296', '0293', '0023', '0210'],
        exerciseCount: 5,
    },
    {
        name: 'PPL — Legs Day',
        category: 'Push Pull Legs',
        exerciseIds: ['0043', '0116', '0585', '0308', '1382'],
        exerciseCount: 5,
    },
    {
        name: 'Upper / Lower — Upper',
        category: 'Upper Lower',
        exerciseIds: ['0025', '0027', '0405', '0296', '0285'],
        exerciseCount: 5,
    },
    {
        name: 'Full Body — Strength',
        category: 'Full Body',
        exerciseIds: ['0043', '0025', '0027', '0405'],
        exerciseCount: 4,
    },
];

/**
 * Multi-tab modal for importing routines via:
 * 1. JSON pasting (Hevy export, Strong, etc.)
 * 2. Built-in templates
 * 3. From workout history
 */
const RoutineImporter: React.FC<RoutineImporterProps> = ({
    isOpen, onClose, onImported
}) => {
    const { saveRoutine, history } = useWorkoutStore();
    const [activeTab, setActiveTab] = useState<ImportTab>('templates');
    const [jsonInput, setJsonInput] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);

    // Unique sessions from history for "From History" tab
    const uniqueSessions = useMemo(() => {
        const seen = new Set<string>();
        return history
            .filter(s => !s.deletedAt && s.sets.length > 0)
            .filter(s => {
                if (seen.has(s.name)) return false;
                seen.add(s.name);
                return true;
            })
            .slice(0, 20); // Limit to 20
    }, [history]);

    const tabs: { id: ImportTab; label: string; icon: React.ReactNode }[] = [
        { id: 'templates', label: 'Templates', icon: <BookTemplate size={14} /> },
        { id: 'history', label: 'From History', icon: <History size={14} /> },
        { id: 'json', label: 'Import', icon: <FileJson size={14} /> },
    ];

    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            let routineName = parsed.name || parsed.title || 'Imported Routine';
            let exerciseIds: string[] = [];

            // Support various JSON formats
            if (parsed.exerciseIds) {
                exerciseIds = parsed.exerciseIds;
            } else if (parsed.exercises) {
                exerciseIds = parsed.exercises.map((e: { id?: string; exerciseId?: string }) => e.id || e.exerciseId || '');
            } else if (Array.isArray(parsed)) {
                exerciseIds = parsed.map((e: { id?: string; exerciseId?: string }) => e.id || e.exerciseId || '');
                routineName = 'Imported Routine';
            }

            if (exerciseIds.length === 0) {
                setJsonError('No exercises found in the JSON. Expected "exerciseIds" or "exercises" array.');
                return;
            }

            const newRoutine: Routine = {
                id: crypto.randomUUID(),
                name: routineName,
                exerciseIds: exerciseIds.filter(Boolean),
            };

            saveRoutine(newRoutine);
            setImportSuccess(true);
            onImported?.(newRoutine);
            setTimeout(() => {
                setImportSuccess(false);
                onClose();
            }, 1500);
        } catch {
            setJsonError('Invalid JSON format. Please check your input.');
        }
    };

    const handleTemplateImport = (template: typeof TEMPLATES[number]) => {
        const newRoutine: Routine = {
            id: crypto.randomUUID(),
            name: template.name,
            exerciseIds: template.exerciseIds,
        };

        saveRoutine(newRoutine);
        setImportSuccess(true);
        onImported?.(newRoutine);
        setTimeout(() => {
            setImportSuccess(false);
            onClose();
        }, 1200);
    };

    const handleHistoryImport = (session: typeof uniqueSessions[number]) => {
        const exerciseIds = [...new Set(session.sets.map(s => s.exerciseId))];

        const newRoutine: Routine = {
            id: crypto.randomUUID(),
            name: session.name,
            exerciseIds,
        };

        saveRoutine(newRoutine);
        setImportSuccess(true);
        onImported?.(newRoutine);
        setTimeout(() => {
            setImportSuccess(false);
            onClose();
        }, 1200);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-end justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                    className="w-full max-w-lg bg-zinc-950 border-t border-zinc-800 overflow-hidden"
                    style={{ maxHeight: '85dvh' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <h2 className="font-heading font-black text-white text-lg uppercase tracking-tight">
                            Add Routine
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tab Bar */}
                    <div className="flex px-5 gap-1 mb-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[10px] font-black uppercase tracking-widest transition-all',
                                    activeTab === tab.id
                                        ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30'
                                        : 'text-zinc-500 border border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
                                )}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Success overlay */}
                    <AnimatePresence>
                        {importSuccess && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-zinc-950/95 z-10 flex flex-col items-center justify-center gap-3"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 12 }}
                                >
                                    <Check size={48} className="text-brand-primary" />
                                </motion.div>
                                <span className="font-mono text-sm font-bold text-brand-primary uppercase">
                                    Routine Created!
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Content */}
                    <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85dvh - 130px)' }}>
                        {/* Templates Tab */}
                        {activeTab === 'templates' && (
                            <div className="space-y-2">
                                {TEMPLATES.map((template, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleTemplateImport(template)}
                                        className="w-full text-left bg-zinc-900/50 border border-zinc-800 p-4 hover:border-brand-primary/30 hover:bg-zinc-900 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-heading font-black text-white text-sm uppercase">
                                                    {template.name}
                                                </div>
                                                <div className="font-mono text-[10px] text-zinc-500 mt-0.5">
                                                    {template.category} · {template.exerciseCount} exercises
                                                </div>
                                            </div>
                                            <Upload size={14} className="text-zinc-600 group-hover:text-brand-primary transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* From History Tab */}
                        {activeTab === 'history' && (
                            <div className="space-y-2">
                                {uniqueSessions.length === 0 ? (
                                    <div className="text-center py-10">
                                        <History size={32} className="text-zinc-700 mx-auto mb-2" />
                                        <p className="font-mono text-xs text-zinc-500">
                                            No workout history yet.
                                        </p>
                                    </div>
                                ) : (
                                    uniqueSessions.map(session => {
                                        const exerciseCount = new Set(session.sets.map(s => s.exerciseId)).size;
                                        const setCount = session.sets.filter(s => s.isCompleted).length;
                                        return (
                                            <button
                                                key={session.id}
                                                onClick={() => handleHistoryImport(session)}
                                                className="w-full text-left bg-zinc-900/50 border border-zinc-800 p-4 hover:border-brand-primary/30 hover:bg-zinc-900 transition-all group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-heading font-black text-white text-sm uppercase">
                                                            {session.name}
                                                        </div>
                                                        <div className="font-mono text-[10px] text-zinc-500 mt-0.5">
                                                            {exerciseCount} exercises · {setCount} sets · {new Date(session.date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <Upload size={14} className="text-zinc-600 group-hover:text-brand-primary transition-colors" />
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* JSON Import Tab */}
                        {activeTab === 'json' && (
                            <div className="space-y-4">
                                <p className="font-mono text-[10px] text-zinc-400 leading-relaxed">
                                    Paste a JSON export from Hevy, Strong, or any app with exercise data.
                                    We'll detect the format automatically.
                                </p>
                                <textarea
                                    value={jsonInput}
                                    onChange={(e) => { setJsonInput(e.target.value); setJsonError(null); }}
                                    placeholder='{"name": "My Routine", "exerciseIds": ["0025", "0027"]}'
                                    className="w-full h-40 bg-zinc-900 border border-zinc-800 text-white font-mono text-xs p-3 resize-none focus:outline-none focus:border-brand-primary/50 placeholder:text-zinc-600"
                                />
                                {jsonError && (
                                    <div className="flex items-center gap-2 text-red-400 font-mono text-[10px]">
                                        <AlertTriangle size={12} />
                                        {jsonError}
                                    </div>
                                )}
                                <button
                                    onClick={handleJsonImport}
                                    disabled={!jsonInput.trim()}
                                    className={cn(
                                        'w-full py-3 font-mono text-xs font-black uppercase tracking-widest transition-all',
                                        jsonInput.trim()
                                            ? 'btn-tech text-zinc-950'
                                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                    )}
                                >
                                    Import Routine
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RoutineImporter;
