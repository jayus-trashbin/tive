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
    Sparkles
} from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
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
    const setProfileOpen = useWorkoutStore(state => state.setProfileOpen);
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
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
                        Configuration
                    </span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tighter">
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
                        className="w-full flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                    >
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                            <span className="font-mono font-bold text-brand-primary text-lg">
                                {userStats.name ? userStats.name.substring(0, 2).toUpperCase() : 'AT'}
                            </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left">
                            <div className="font-bold text-white">
                                {userStats.name || 'Athlete'}
                            </div>
                            <div className="text-xs font-mono text-zinc-500">
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
                        <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800">
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
                                    <div className="text-xs font-mono text-zinc-500">
                                        {isConnected ? 'Connected' : 'Not configured'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setProfileOpen(true)}
                                className="px-3 py-1.5 text-xs font-mono font-bold text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/10 transition-colors cursor-pointer"
                            >
                                {isConnected ? 'Edit' : 'Setup'}
                            </button>
                        </div>

                        {/* Last Sync */}
                        <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800">
                            <div>
                                <div className="text-sm font-bold text-white">Last Sync</div>
                                <div className="text-xs font-mono text-zinc-500">{lastSync}</div>
                            </div>
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
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
                    <div className="p-4 bg-zinc-900 border border-zinc-800 space-y-3">
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
                                className="w-full bg-black border border-zinc-700 p-3 text-sm font-mono text-white placeholder:text-zinc-700 focus:border-brand-primary focus:outline-none rounded-[2px]"
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
                        <div className="p-4 bg-zinc-900 border border-zinc-800">
                            <div className="text-sm font-bold text-white mb-3">Theme</div>
                            <div className="flex gap-2">
                                {['Dark', 'OLED', 'Light'].map((theme) => (
                                    <button
                                        key={theme}
                                        className={cn(
                                            "flex-1 py-2 text-xs font-mono font-bold uppercase transition-colors cursor-pointer",
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
                        <div className="p-4 bg-zinc-900 border border-zinc-800">
                            <div className="text-sm font-bold text-white mb-3">Units</div>
                            <div className="flex gap-2">
                                {['Metric', 'Imperial'].map((unit) => (
                                    <button
                                        key={unit}
                                        className={cn(
                                            "flex-1 py-2 text-xs font-mono font-bold uppercase transition-colors cursor-pointer",
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

                {/* Data Section */}
                <Section
                    icon={Database}
                    title="Data"
                    description="Export, import, and manage your data"
                >
                    <div className="space-y-3">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-zinc-900 border border-zinc-800 text-center">
                                <div className="text-2xl font-mono font-black text-white">{historyLength}</div>
                                <div className="text-[10px] font-mono text-zinc-500 uppercase">Sessions</div>
                            </div>
                            <div className="p-4 bg-zinc-900 border border-zinc-800 text-center">
                                <div className="text-2xl font-mono font-black text-white">{routinesLength}</div>
                                <div className="text-[10px] font-mono text-zinc-500 uppercase">Routines</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer">
                                <Download size={16} />
                                <span className="text-xs font-mono font-bold">Export</span>
                            </button>
                            <button className="flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer">
                                <Upload size={16} />
                                <span className="text-xs font-mono font-bold">Import</span>
                            </button>
                        </div>

                        {/* Danger Zone */}
                        <button className="w-full flex items-center justify-center gap-2 p-3 border border-red-900/50 text-red-400 hover:bg-red-900/10 transition-colors cursor-pointer">
                            <Trash2 size={16} />
                            <span className="text-xs font-mono font-bold">Clear All Data</span>
                        </button>
                    </div>
                </Section>

                {/* App Info */}
                <div className="text-center py-6">
                    <div className="font-mono text-xs text-zinc-700">
                        TIVE v1.0.0
                    </div>
                    <div className="font-mono text-[10px] text-zinc-800 mt-1">
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
            <Icon size={14} className="text-zinc-500" />
            <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                {title}
            </h2>
        </div>
        <p className="text-xs text-zinc-600 mb-3">{description}</p>
        {children}
    </section>
);

export default Settings;
