import React, { useState } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';

const ExportDataButton: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleExport = async () => {
        try {
            setStatus('loading');

            // 1. Gather Data
            const state = useWorkoutStore.getState();
            const exportData = {
                metadata: {
                    version: '1.0',
                    timestamp: new Date().toISOString(),
                    app: 'TIVE',
                },
                data: {
                    userStats: state.userStats,
                    history: state.history,
                    routines: state.routines,
                    exercises: state.exercises,
                    physiology: state.physiology,
                }
            };

            // 2. Create Blob
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // 3. Trigger Download
            const link = document.createElement('a');
            link.href = url;
            link.download = `tive_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (error) {
            console.error("Export failed:", error);
            setStatus('idle');
            alert("Failed to export data.");
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={status !== 'idle'}
            className="flex items-center justify-center gap-2 p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white hover:border-brand-primary/50 hover:bg-zinc-900 transition-all group w-full"
        >
            {status === 'loading' ? (
                <Loader2 size={16} className="animate-spin text-brand-primary" />
            ) : status === 'success' ? (
                <>
                    <Check size={16} className="text-brand-success" />
                    <span className="text-xs font-bold text-brand-success">Exported!</span>
                </>
            ) : (
                <>
                    <Download size={16} className="group-hover:text-brand-primary transition-colors" />
                    <span className="text-xs font-bold">Export JSON</span>
                </>
            )}
        </button>
    );
};

export default ExportDataButton;
