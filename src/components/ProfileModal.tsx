
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    X, Settings, Activity, CheckCircle2
} from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useActiveSessions } from '../store/selectors';
import { useUIStore } from '../store/useUIStore';
import { syncService } from '../services/SyncService';

import { photoSyncService } from '../services/PhotoSyncService';
import { credentialsStore } from '../utils/credentialsStore';
import { cn } from '../lib/utils';
import { ProfileStats } from './profile/ProfileStats';
import { ProfileSettings } from './profile/ProfileSettings';
import { IconButton } from './ui';


interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const userStats = useWorkoutStore(state => state.userStats);
    const updateUserStats = useWorkoutStore(state => state.updateUserStats);
    const activeSessions = useActiveSessions();
    const exercises = useWorkoutStore(state => state.exercises);
    const resetStorage = useWorkoutStore(state => state.resetStorage);
    const [activeTab, setActiveTab] = useState<'stats' | 'settings'>('stats');

    // Local state for settings form
    const [formData, setFormData] = useState({
        name: userStats.name || '',
        email: userStats.email || '',
        bodyweight: userStats.bodyweight,
        gender: userStats.gender,
        supabaseUrl: userStats.supabaseUrl || '',
        supabaseKey: userStats.supabaseKey || '',
        unitSystem: userStats.unitSystem || 'metric',
        theme: userStats.theme || 'dark',
        geminiApiKey: userStats.geminiApiKey || '',
        isAudioEnabled: userStats.isAudioEnabled ?? true,
        isVibrationEnabled: userStats.isVibrationEnabled ?? true,
        smartAudio: userStats.smartAudio ?? true
    });

    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Sync state when opening
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: userStats.name || '',
                email: userStats.email || '',
                bodyweight: userStats.bodyweight,
                gender: userStats.gender,
                supabaseUrl: userStats.supabaseUrl || '',
                supabaseKey: userStats.supabaseKey || '',
                unitSystem: userStats.unitSystem || 'metric',
                theme: userStats.theme || 'dark',
                geminiApiKey: userStats.geminiApiKey || '',
                isAudioEnabled: userStats.isAudioEnabled ?? true,
                isVibrationEnabled: userStats.isVibrationEnabled ?? true,
                smartAudio: userStats.smartAudio ?? true
            });
        }
    }, [isOpen, userStats]);

    const handleSaveSettings = async () => {
        // 1. Save Basic
        updateUserStats(formData);

        // 2. Persist credentials to separate store (excluded from IDB)
        credentialsStore.setSupabase(formData.supabaseUrl, formData.supabaseKey);
        if (formData.geminiApiKey) {
            credentialsStore.setGeminiKey(formData.geminiApiKey);
        }

        // 3. Reset service clients so they pick up new credentials
        syncService.reset();
        photoSyncService.reset();

        // 4. Validate Cloud if provided
        if (formData.supabaseUrl && formData.supabaseKey) {
            setStatusMsg({ type: 'success', text: 'Validating Connection...' });
            const isValid = await syncService.validateConnection(formData.supabaseUrl, formData.supabaseKey);

            if (isValid) {
                setStatusMsg({ type: 'success', text: 'Connection Successful! Syncing...' });
                useUIStore.getState().addNotification('Cloud connection successful. Sync started.', 'success');
                syncService.sync();
                setTimeout(() => setStatusMsg(null), 3000);
            } else {
                setStatusMsg({ type: 'error', text: 'Connection Failed. Check URL/Key.' });
                useUIStore.getState().addNotification('Cloud connection failed. Please check your credentials.', 'error');
            }
        } else {
            setStatusMsg({ type: 'success', text: 'Settings Saved' });
            useUIStore.getState().addNotification('Settings saved locally.', 'success');
            setTimeout(() => setStatusMsg(null), 2000);
        }

    };

    const handleReset = () => {
        if (confirm("ARE YOU SURE? This will wipe all your workout history. This cannot be undone.")) {
            resetStorage();
            onClose();
        }
    };

    const isCloudConfigured = formData.supabaseUrl && formData.supabaseKey;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-modal flex items-end justify-center pointer-events-none">

            {/* Backdrop with heavy blur */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl pointer-events-auto"
            />

            {/* Modal Drawer */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 30, stiffness: 300, bounce: 0 }}
                className="w-full max-w-lg bg-zinc-950/95 border-t border-zinc-800 rounded-t-[2.5rem] h-[92vh] flex flex-col pointer-events-auto relative shadow-2xl overflow-hidden"
            >
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-4 pb-2 shrink-0 cursor-pointer bg-zinc-950/95" onClick={onClose}>
                    <div className="w-10 h-1 bg-zinc-700" />
                </div>

                {/* Header */}
                <div className="px-6 pb-4 flex justify-between items-center shrink-0 bg-zinc-950/90">
                    <div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                            {userStats.name ? userStats.name : 'Athlete Profile'}
                        </h2>
                        <div className="data-label flex items-center gap-1 mt-1">
                            {isCloudConfigured ? (
                                <span className="text-brand-success flex items-center gap-1"><CheckCircle2 size={10} /> Cloud Sync Active</span>
                            ) : 'Local Storage Only'}
                        </div>
                    </div>
                    <IconButton
                        icon={X}
                        aria-label="Close Profile"
                        variant="default"
                        onClick={onClose}
                    />

                </div>

                {/* Tabs */}
                <div className="px-6 mb-6 shrink-0 bg-zinc-950/95">
                    <div className="bg-zinc-900 p-1 rounded-2xl flex relative border border-zinc-800">
                        <motion.div
                            layoutId="profileTab"
                            className="absolute top-1 bottom-1 bg-zinc-800 rounded-xl"
                            initial={false}
                            animate={{
                                left: activeTab === 'stats' ? '4px' : '50%',
                                width: 'calc(50% - 4px)'
                            }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        />

                        <button
                            onClick={() => setActiveTab('stats')}
                            className={cn(
                                "flex-1 py-2.5 text-sm font-bold relative z-10 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider",
                                activeTab === 'stats' ? "text-white" : "text-zinc-500"
                            )}
                        >
                            <Activity size={16} /> STATS
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={cn(
                                "flex-1 py-2.5 text-sm font-bold relative z-10 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider",
                                activeTab === 'settings' ? "text-white" : "text-zinc-500"
                            )}
                        >
                            <Settings size={16} /> CONFIG
                        </button>
                    </div>
                </div>

                {/* Scrollable Content Container */}
                {activeTab === 'stats' ? (
                    <div className="flex-1 overflow-y-auto px-6 space-y-6 bg-gradient-to-b from-zinc-950/0 to-zinc-950/50 pb-safe">
                        <ProfileStats history={activeSessions} exercises={exercises} userStats={userStats} />
                    </div>
                ) : (
                    <ProfileSettings
                        formData={formData}
                        setFormData={setFormData}
                        userStats={userStats}
                        onReset={handleReset}
                        onSave={handleSaveSettings}
                        statusMsg={statusMsg}
                    />
                )}
            </motion.div>
        </div>
    );
};

export default ProfileModal;
