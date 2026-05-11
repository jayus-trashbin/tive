import React from 'react';
import { motion } from 'framer-motion';
import {
    Settings as SettingsIcon,
    User,
    Cloud,
    Palette,
    Database,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Download,
    Upload,
    Trash2,
    Sparkles,
    Volume2,
    Music,
    Vibrate
} from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useUIStore } from '../store/useUIStore';
import { credentialsStore } from '../utils/credentialsStore';
import { cn } from '../lib/utils';

/**
 * Settings Page
 * Premium configuration with sections for:
 * - Profile
 * - Sync & Backup
 * - Appearance
 * - Data Management
 */
const Settings: React.FC = () => {
    const userStats = useWorkoutStore(state => state.userStats);
    const setProfileOpen = useUIStore(state => state.setProfileOpen);
    const historyLength = useWorkoutStore(state => state.history.length);
    const routinesLength = useWorkoutStore(state => state.routines.length);

    const lastSync = userStats.lastSyncTime
        ? new Date(userStats.lastSyncTime).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'Never';

    const isConnected = !!(userStats.supabaseUrl && userStats.supabaseKey);

    return (
        <div className="flex flex-col h-full overflow-y-auto px-4 pt-safe pb-32 no-scrollbar scroll-smooth">
            {/* Header */}
            <header className="shrink-0 mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <SettingsIcon size={16} className="text-brand-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                        Configuration
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    Settings
                </h1>
            </header>

            {/* Sections */}
            <div className="space-y-6">
                {/* Profile Section */}
                <Section
                    icon={User}
                    title="Profile"
                    description="Your personal information"
                >
                    <motion.button
                        onClick={() => setProfileOpen(true)}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors cursor-pointer"
                    >
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                            <span className="font-bold text-brand-primary text-lg">
                                {userStats.name ? userStats.name.substring(0, 2).toUpperCase() : 'AT'}
                            </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left">
                            <div className="font-bold text-white">
                                {userStats.name || 'Athlete'}
                            </div>
                            <div className="text-xs font-medium text-zinc-500">
                                {userStats.bodyweight ? `${userStats.bodyweight} kg` : 'No weight set'}
                                {userStats.height ? ` • ${userStats.height} cm` : ''}
                            </div>
                        </div>

                        <ChevronRight size={20} className="text-zinc-600" />
                    </motion.button>
                </Section>

                {/* Sync & Backup Section */}
                <Section
                    icon={Cloud}
                    title="Sync & Backup"
                    description="Cloud storage and synchronization"
                >
                    <div className="space-y-3">
                        {/* Connection Status */}
                        <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                            <div className="flex items-center gap-3">
                                {isConnected ? (
                                    <CheckCircle2 size={20} className="text-brand-success" />
                                ) : (
                                    <AlertCircle size={20} className="text-zinc-500" />
                                )}
                                <div>
                                    <div className="text-sm font-bold text-white">
                                        Supabase
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {isConnected ? 'Connected' : 'Not configured'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setProfileOpen(true)}
                                className="px-3 py-1.5 text-xs font-bold text-brand-primary border border-brand-primary/30 rounded-lg hover:bg-brand-primary/10 transition-colors cursor-pointer"
                            >
                                {isConnected ? 'Edit' : 'Setup'}
                            </button>
                        </div>

                        {/* Last Sync */}
                        <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                            <div>
                                <div className="text-sm font-bold text-white">Last Sync</div>
                                <div className="text-xs text-zinc-500">{lastSync}</div>
                            </div>
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-zinc-300 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
                            >
                                <RefreshCw size={14} />
                                Sync Now
                            </button>
                        </div>
                    </div>
                </Section>

                {/* AI Section */}
                <Section
                    icon={Sparkles}
                    title="Assistant"
                    description="Configure your AI Coach"
                >
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                        <div>
                            <div className="text-sm font-bold text-white mb-1">Gemini API Key</div>
                            <div className="text-xs text-zinc-500 mb-3">
                                Required for AI routine generation. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">Google AI Studio</a>.
                            </div>
                            <input
                                type="password"
                                value={userStats.geminiApiKey || ''}
                                onChange={(e) => {
                                    useWorkoutStore.getState().updateUserStats({ geminiApiKey: e.target.value });
                                    credentialsStore.setGeminiKey(e.target.value);
                                }}
                                placeholder="AIzaSy..."
                                className="w-full bg-black border border-zinc-700 p-3 text-sm text-white placeholder:text-zinc-700 focus:border-brand-primary focus:outline-none rounded-xl"
                            />
                        </div>
                    </div>
                </Section>

                {/* Appearance Section */}
                <Section
                    icon={Palette}
                    title="Appearance"
                    description="Theme and display preferences"
                >
                    <div className="space-y-3">
                        {/* Theme Toggle */}
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                            <div className="text-sm font-bold text-white mb-3">Theme</div>
                            <div className="flex gap-2">
                                {['Dark', 'OLED', 'Light'].map((theme) => (
                                    <button
                                        key={theme}
                                        className={cn(
                                            "flex-1 py-2 text-xs font-bold uppercase transition-colors rounded-lg cursor-pointer",
                                            theme === 'Dark'
                                                ? "bg-brand-primary text-black"
                                                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                                        )}
                                    >
                                        {theme}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Units Toggle */}
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                            <div className="text-sm font-bold text-white mb-3">Units</div>
                            <div className="flex gap-2">
                                {['Metric', 'Imperial'].map((unit) => (
                                    <button
                                        key={unit}
                                        className={cn(
                                            "flex-1 py-2 text-xs font-bold uppercase transition-colors rounded-lg cursor-pointer",
                                            unit === 'Metric'
                                                ? "bg-brand-primary text-black"
                                                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                                        )}
                                    >
                                        {unit}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Audio & Haptics Section */}
                <Section
                    icon={Volume2}
                    title="Audio & Haptics"
                    description="Feedback during workouts"
                >
                    <div className="space-y-3">
                        {/* Audio Toggle */}
                        <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Volume2 size={20} className={userStats.isAudioEnabled !== false ? "text-brand-primary" : "text-zinc-600"} />
                                <div>
                                    <div className="text-sm font-bold text-white">App Sounds</div>
                                    <div className="text-xs text-zinc-500">Timer beeps & PR alerts</div>
                                </div>
                            </div>
                            <button
                                onClick={() => useWorkoutStore.getState().updateUserStats({ isAudioEnabled: userStats.isAudioEnabled === false ? true : false })}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                    userStats.isAudioEnabled !== false ? "bg-brand-primary" : "bg-zinc-700"
                                )}
                            >
                                <span className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-black transition-transform",
                                    userStats.isAudioEnabled !== false ? "translate-x-6" : "translate-x-1"
                                )} />
                            </button>
                        </div>

                        {/* Smart Audio Toggle */}
                        <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Music size={20} className={userStats.smartAudio !== false ? "text-brand-primary" : "text-zinc-600"} />
                                <div>
                                    <div className="text-sm font-bold text-white">Smart Audio Detection</div>
                                    <div className="text-[10px] text-zinc-500 max-w-[200px]">Automatically mute app sounds when Spotify/Apple Music is playing</div>
                                </div>
                            </div>
                            <button
                                onClick={() => useWorkoutStore.getState().updateUserStats({ smartAudio: userStats.smartAudio === false ? true : false })}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                    userStats.smartAudio !== false ? "bg-brand-primary" : "bg-zinc-700"
                                )}
                            >
                                <span className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-black transition-transform",
                                    userStats.smartAudio !== false ? "translate-x-6" : "translate-x-1"
                                )} />
                            </button>
                        </div>

                        {/* Vibration Toggle */}
                        <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Vibrate size={20} className={userStats.isVibrationEnabled !== false ? "text-brand-primary" : "text-zinc-600"} />
                                <div>
                                    <div className="text-sm font-bold text-white">Haptic Feedback</div>
                                    <div className="text-xs text-zinc-500">Vibrations on actions</div>
                                </div>
                            </div>
                            <button
                                onClick={() => useWorkoutStore.getState().updateUserStats({ isVibrationEnabled: userStats.isVibrationEnabled === false ? true : false })}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                    userStats.isVibrationEnabled !== false ? "bg-brand-primary" : "bg-zinc-700"
                                )}
                            >
                                <span className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-black transition-transform",
                                    userStats.isVibrationEnabled !== false ? "translate-x-6" : "translate-x-1"
                                )} />
                            </button>
                        </div>
                    </div>
                </Section>

                {/* Data Section */}
                <Section
                    icon={Database}
                    title="Data"
                    description="Export, import, and manage your data"
                >
                    <div className="space-y-3">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-zinc-900 border border-zinc-800 text-center rounded-2xl">
                                <div className="text-3xl font-bold text-white">{historyLength}</div>
                                <div className="text-xs text-zinc-500 uppercase mt-1">Sessions</div>
                            </div>
                            <div className="p-4 bg-zinc-900 border border-zinc-800 text-center rounded-2xl">
                                <div className="text-3xl font-bold text-white">{routinesLength}</div>
                                <div className="text-xs text-zinc-500 uppercase mt-1">Routines</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer">
                                <Download size={16} />
                                <span className="text-sm font-bold">Export</span>
                            </button>
                            <button className="flex items-center justify-center gap-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer">
                                <Upload size={16} />
                                <span className="text-sm font-bold">Import</span>
                            </button>
                        </div>

                        {/* Danger Zone */}
                        <button className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-900/50 text-red-400 hover:bg-red-900/10 transition-colors cursor-pointer">
                            <Trash2 size={16} />
                            <span className="text-sm font-bold">Clear All Data</span>
                        </button>
                    </div>
                </Section>

                {/* App Info */}
                <div className="text-center py-6">
                    <div className="font-medium text-xs text-zinc-700">
                        TIVE v1.0.0
                    </div>
                    <div className="font-medium text-[10px] text-zinc-800 mt-1">
                        Built with 💪 by @kawe
                    </div>
                </div>
            </div>
        </div>
    );
};

// Section Component
interface SectionProps {
    icon: React.ElementType;
    title: string;
    description: string;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon: Icon, title, description, children }) => (
    <section>
        <div className="flex items-center gap-2 mb-2">
            <Icon size={16} className="text-zinc-500" />
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                {title}
            </h2>
        </div>
        <p className="text-xs text-zinc-600 mb-3">{description}</p>
        {children}
    </section>
);

export default Settings;
