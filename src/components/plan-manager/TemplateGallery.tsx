import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookTemplate, PlusCircle, Check } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { routineTemplates } from '../../data/routineTemplates';
import { Routine, RoutineBlock } from '../../types/domain';
import { IconButton } from '../ui';
import { useTranslation } from '../../i18n';
import { TranslationKey } from '../../i18n/types';

interface TemplateGalleryProps {
    onClose: () => void;
    onApplyTemplate: (routineId: string) => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onClose, onApplyTemplate }) => {
    const { saveRoutine } = useWorkoutStore();
    const { t } = useTranslation();
    const [importSuccess, setImportSuccess] = useState(false);

    const handleApply = (template: Routine) => {
        // Deep clone with new IDs
        const newRoutineId = crypto.randomUUID();
        const clonedBlocks: RoutineBlock[] = (template.blocks || []).map(b => ({
            ...b,
            id: crypto.randomUUID(),
            sets: b.sets.map(s => ({
                ...s,
                id: crypto.randomUUID()
            }))
        }));

        const newRoutine: Routine = {
            ...template,
            id: newRoutineId,
            blocks: clonedBlocks,
            exerciseIds: clonedBlocks.map(b => b.exerciseId),
            updatedAt: Date.now(),
            _synced: false
        };

        saveRoutine(newRoutine);
        setImportSuccess(true);
        setTimeout(() => {
            setImportSuccess(false);
            onClose();
            onApplyTemplate(newRoutineId); // Opens in editor
        }, 800);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-[60] flex flex-col"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 bg-zinc-950">
                    <div className="flex items-center gap-2">
                        <BookTemplate size={20} className="text-brand-primary" />
                        <h2 className="font-heading font-bold text-white text-lg uppercase tracking-tight">
                            {t('templates.title') || 'Template Gallery'}
                        </h2>
                    </div>
                    <IconButton
                        icon={X}
                        onClick={onClose}
                        variant="ghost"
                        size="md"
                        aria-label="Close"
                    />
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
                    {routineTemplates.map(template => {
                        const exerciseCount = template.blocks?.length || template.exerciseIds.length;
                        const setsCount = template.blocks?.reduce((acc, b) => acc + b.sets.length, 0) || 0;
                        
                        return (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3"
                            >
                                <div>
                                    <h3 className="font-heading font-bold text-white text-base uppercase">
                                        {t(`templates.${template.id}.name` as TranslationKey) || template.name}
                                    </h3>
                                    <p className="font-medium text-[11px] text-zinc-400 mt-1">
                                        {exerciseCount} exercises · {setsCount} total sets
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleApply(template)}
                                    className="flex items-center justify-center gap-2 w-full h-10 bg-zinc-800 text-white font-bold uppercase tracking-wider text-[11px] rounded-lg hover:bg-zinc-700 transition-colors"
                                >
                                    <PlusCircle size={14} />
                                    {t('templates.apply') || 'Use Template'}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {importSuccess && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-zinc-950/95 z-50 flex flex-col items-center justify-center gap-3"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 12 }}
                            >
                                <Check size={48} className="text-brand-primary" />
                            </motion.div>
                            <span className="font-medium text-sm font-bold text-brand-primary uppercase">
                                {t('templates.created') || 'Routine Created!'}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
};

export default TemplateGallery;
