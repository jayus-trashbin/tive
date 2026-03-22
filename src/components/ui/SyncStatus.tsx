import React, { useMemo } from 'react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { Cloud, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { syncService } from '../../services/SyncService';

const SyncStatus: React.FC = () => {
    const isSyncing = useWorkoutStore(state => state.isSyncing);
    const lastSyncError = useWorkoutStore(state => state.lastSyncError);
    const lastSyncTime = useWorkoutStore(state => state.userStats.lastSyncTime);

    const formattedTime = useMemo(() => {
        if (!lastSyncTime) return 'Never';
        return new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [lastSyncTime]);

    if (isSyncing) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                <Loader2 size={12} className="text-yellow-500 animate-spin" />
                <span className="text-xs font-mono text-yellow-500 uppercase tracking-wider">Syncing...</span>
            </div>
        );
    }

    if (lastSyncError) {
        return (
            <button
                onClick={() => syncService.sync()}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full hover:bg-red-500/20 transition-colors"
                title={lastSyncError}
            >
                <AlertCircle size={12} className="text-red-500" />
                <span className="text-xs font-mono text-red-500 uppercase tracking-wider">Sync Error</span>
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full">
            <Cloud size={12} className="text-brand-primary" />
            <span className="text-xs font-mono text-brand-primary uppercase tracking-wider">Synced {formattedTime}</span>
        </div>
    );
};

export default SyncStatus;
