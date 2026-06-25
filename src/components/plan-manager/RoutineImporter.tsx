import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileJson, BookTemplate, History, Upload, Check, AlertTriangle } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { Routine } from '../../types/domain';
import { cn } from '../../lib/utils';
import { Button, IconButton, Modal } from '../ui';


interface RoutineImporterProps {
    isOpen: boolean;
    onClose: () => void;
    onImported?: (routine: Routine) => void;
}

type ImportTab = 'external' | 'templates' | 'history';


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
        { id: 'external', label: 'External', icon: <FileJson size={14} /> },
    ];


    const handleExternalImport = () => {
        const input = jsonInput.trim();
        if (!input) return;

        try {
            let routineName = 'Imported Routine';
            let exerciseIds: string[] = [];

            // 1. Try JSON Parser
            if (input.startsWith('{') || input.startsWith('[')) {
                const parsed = JSON.parse(input);
                routineName = parsed.name || parsed.title || 'Imported Routine';
                
                if (parsed.exerciseIds) {
                    exerciseIds = parsed.exerciseIds;
                } else if (parsed.exercises) {
                    exerciseIds = parsed.exercises.map((e: any) => e.id || e.exerciseId || e.name || '');
                } else if (Array.isArray(parsed)) {
                    exerciseIds = parsed.map((e: any) => e.id || e.exerciseId || e.name || '');
                }
            } 
            // 2. Try CSV Parser (Hevy/Strong)
            else if (input.toLowerCase().includes('date') && (input.toLowerCase().includes('workout') || input.toLowerCase().includes('exercise'))) {
                // Hevy/Strong detection
                const lines = input.split('\n');
                const headers = lines[0].toLowerCase();
                const isHevy = headers.includes('workout name') && headers.includes('exercise name');
                const isStrong = headers.includes('workout name') && headers.includes('duration');

                if (isHevy || isStrong) {
                    // Extract unique exercises from the last workout mentioned in the CSV
                    // We'll take the first workout block we find
                    const rows = lines.slice(1).map(l => l.split(','));
                    const workoutName = rows[0]?.[1]?.replace(/"/g, '') || 'Imported ' + (isHevy ? 'Hevy' : 'Strong');
                    
                    const exCol = isHevy ? 2 : 3; // Exercise Name column index
                    const seen = new Set<string>();
                    
                    // Simple slugify for matching fallback exercises if possible
                    rows.forEach(r => {
                        const name = r[exCol]?.replace(/"/g, '').trim();
                        if (name && name !== 'Exercise Name') seen.add(name);
                    });

                    exerciseIds = Array.from(seen);
                    routineName = workoutName;
                }
            }

            if (exerciseIds.length === 0) {
                setJsonError('No exercises found. Ensure format is JSON or a valid Hevy/Strong CSV export.');
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
        } catch (e) {
            setJsonError('Parse error. Check your input format.');
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false}
            position="bottom"
            className="w-full max-w-lg border-t border-zinc-800"
            bodyClassName="p-0 max-h-[85vh] overflow-hidden"
        >
            <div className="flex flex-col overflow-hidden max-h-[85vh] bg-zinc-950 relative">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 bg-zinc-950">
                    <h2 className="font-heading font-bold text-white text-lg uppercase tracking-tight">
                        Add Routine
                    </h2>
                    <IconButton
                        icon={X}
                        onClick={onClose}
                        variant="ghost"
                        size="md"
                        aria-label="Close"
                    />
                </div>

                {/* Tab Bar */}
                <div className="flex px-5 gap-1 mb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-1.5 py-2 font-medium text-caption-xs font-bold uppercase tracking-widest transition-all tap',
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
                            <span className="font-medium text-sm font-bold text-brand-primary uppercase">
                                Routine Created!
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 130px)' }}>
                    {/* Templates Tab */}
                    {activeTab === 'templates' && (
                        <div className="space-y-2">
                            {TEMPLATES.map((template, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleTemplateImport(template)}
                                    className="w-full text-left bg-zinc-900/50 border border-zinc-800 p-4 hover:border-brand-primary/30 hover:bg-zinc-900 transition-all group tap"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-heading font-bold text-white text-sm uppercase">
                                                {template.name}
                                            </div>
                                            <div className="font-medium text-caption-xs text-zinc-500 mt-0.5">
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
                                    <p className="font-medium text-xs text-zinc-500">
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
                                            className="w-full text-left bg-zinc-900/50 border border-zinc-800 p-4 hover:border-brand-primary/30 hover:bg-zinc-900 transition-all group tap"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-heading font-bold text-white text-sm uppercase">
                                                        {session.name}
                                                    </div>
                                                    <div className="font-medium text-caption-xs text-zinc-500 mt-0.5">
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

                    {/* External Import Tab */}
                    {activeTab === 'external' && (
                        <div className="space-y-4">
                            <p className="font-medium text-caption-xs text-zinc-400 leading-relaxed">
                                Paste a JSON routine or a **Hevy/Strong CSV** export.
                                We'll extract the exercises to create a new routine.
                            </p>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => { setJsonInput(e.target.value); setJsonError(null); }}
                                placeholder='Paste JSON or CSV content here...'
                                className="w-full h-40 bg-zinc-900 border border-zinc-800 text-white font-medium text-xs p-3 resize-none focus:outline-none focus:border-brand-primary/50 placeholder:text-zinc-600"
                            />
                            {jsonError && (
                                <div className="flex items-center gap-2 text-red-400 font-medium text-caption-xs">
                                    <AlertTriangle size={12} />
                                    {jsonError}
                                </div>
                            )}
                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                onClick={handleExternalImport}
                                disabled={!jsonInput.trim()}
                            >
                                Parse & Create Routine
                            </Button>
                        </div>
                    )}

                </div>
            </div>
        </Modal>
    );
};

export default RoutineImporter;
