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
    Vibrate,
    Ruler
} from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useUIStore } from '../store/useUIStore';
import { credentialsStore } from '../utils/credentialsStore';
import { cn } from '../lib/utils';
import { Button, IconButton } from './ui';


/**
 * Settings Page
 * Premium configuration with grouped lists and sleek micro-interactions
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
            <header className="shrink-0 mb-6 mt-2">
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
            <motion.div 
                className="space-y-6"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: {
                        transition: {
                            staggerChildren: 0.05
                        }
                    }
                }}
            >
                
                {/* Profile Section */}
                <motion.div variants={itemVariants}>
                    <Section title="Account" description="Manage your personal information and physical stats">
                        <button
                            onClick={() => setProfileOpen(true)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer text-left active:bg-zinc-800"
                        >
                            <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center shrink-0">
                                <span className="font-bold text-brand-primary text-lg">
                                    {userStats.name ? userStats.name.substring(0, 2).toUpperCase() : 'AT'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-white text-base truncate">
                                    {userStats.name || 'Athlete Profile'}
                                </div>
                                <div className="text-xs font-medium text-zinc-500 truncate">
                                    {userStats.bodyweight ? `${userStats.bodyweight} kg` : 'No weight set'}
                                    {userStats.height ? ` • ${userStats.height} cm` : ''}
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-zinc-600 shrink-0" />
                        </button>
                    </Section>
                </motion.div>

                {/* Sync & Backup Section */}
                <motion.div variants={itemVariants}>
                    <Section title="Sync & Backup" description="Your data is safely stored in the cloud via Supabase">
                        <div className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Cloud} color="bg-blue-500" />
                                <div>
                                    <div className="text-sm font-bold text-white">Supabase Connection</div>
                                    <div className="text-[11px] text-zinc-500">
                                        {isConnected ? 'Connected' : 'Not configured'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isConnected ? (
                                    <CheckCircle2 size={16} className="text-brand-success" />
                                ) : (
                                    <AlertCircle size={16} className="text-zinc-500" />
                                )}
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setProfileOpen(true)}
                                >
                                    {isConnected ? 'Edit' : 'Setup'}
                                </Button>

                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0"><RefreshCw size={18} /></div>
                                <div>
                                    <div className="text-sm font-bold text-white">Last Sync</div>
                                    <div className="text-[11px] text-zinc-500">{lastSync}</div>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                iconLeft={RefreshCw}
                                onClick={() => {}} // TODO: Add sync logic
                            >
                                Sync Now
                            </Button>

                        </div>
                    </Section>
                </motion.div>

                {/* Assistant Section */}
                <motion.div variants={itemVariants}>
                    <Section title="AI Assistant" description="Configure Gemini API for smart workout generation">
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <IconBox icon={Sparkles} color="bg-purple-500" />
                                <div className="text-sm font-bold text-white">Gemini API Key</div>
                            </div>
                            <input
                                type="password"
                                value={userStats.geminiApiKey || ''}
                                onChange={(e) => {
                                    useWorkoutStore.getState().updateUserStats({ geminiApiKey: e.target.value });
                                    credentialsStore.setGeminiKey(e.target.value);
                                }}
                                placeholder="AIzaSy..."
                                className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none rounded-xl transition-all"
                            />
                            <div className="text-[10px] text-zinc-500 mt-2 ml-1">
                                Get your free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">Google AI Studio</a>
                            </div>
                        </div>
                    </Section>
                </motion.div>

                {/* Appearance Section */}
                <motion.div variants={itemVariants}>
                    <Section title="Preferences">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Palette} color="bg-orange-500" />
                                <div className="text-sm font-bold text-white">Theme</div>
                            </div>
                            <div className="w-48">
                                <SegmentedControl 
                                    id="theme"
                                    options={['Dark', 'OLED', 'Light']} 
                                    value={'Dark'} 
                                    onChange={() => {}} 
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Ruler} color="bg-emerald-500" />
                                <div className="text-sm font-bold text-white">Units</div>
                            </div>
                            <div className="w-32">
                                <SegmentedControl 
                                    id="units"
                                    options={['KG', 'LBS']} 
                                    value={'KG'} 
                                    onChange={() => {}} 
                                />
                            </div>
                        </div>
                    </Section>
                </motion.div>

                {/* Audio & Haptics Section */}
                <motion.div variants={itemVariants}>
                    <Section title="Audio & Haptics" description="Feedback during intense workouts">
                        <div className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Volume2} color={userStats.isAudioEnabled !== false ? "bg-brand-primary" : "bg-zinc-600"} iconColor={userStats.isAudioEnabled !== false ? "text-black" : "text-white"} />
                                <div>
                                    <div className="text-sm font-bold text-white">App Sounds</div>
                                    <div className="text-[11px] text-zinc-500">Timer beeps & PR alerts</div>
                                </div>
                            </div>
                            <Toggle 
                                checked={userStats.isAudioEnabled !== false} 
                                onChange={() => useWorkoutStore.getState().updateUserStats({ isAudioEnabled: userStats.isAudioEnabled === false ? true : false })} 
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Music} color={userStats.smartAudio !== false ? "bg-brand-primary" : "bg-zinc-600"} iconColor={userStats.smartAudio !== false ? "text-black" : "text-white"} />
                                <div>
                                    <div className="text-sm font-bold text-white">Smart Audio</div>
                                    <div className="text-[11px] text-zinc-500 max-w-[200px]">Mute when music is playing</div>
                                </div>
                            </div>
                            <Toggle 
                                checked={userStats.smartAudio !== false} 
                                onChange={() => useWorkoutStore.getState().updateUserStats({ smartAudio: userStats.smartAudio === false ? true : false })} 
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Vibrate} color={userStats.isVibrationEnabled !== false ? "bg-brand-primary" : "bg-zinc-600"} iconColor={userStats.isVibrationEnabled !== false ? "text-black" : "text-white"} />
                                <div>
                                    <div className="text-sm font-bold text-white">Haptic Feedback</div>
                                    <div className="text-[11px] text-zinc-500">Vibrations on actions</div>
                                </div>
                            </div>
                            <Toggle 
                                checked={userStats.isVibrationEnabled !== false} 
                                onChange={() => useWorkoutStore.getState().updateUserStats({ isVibrationEnabled: userStats.isVibrationEnabled === false ? true : false })} 
                            />
                        </div>
                    </Section>
                </motion.div>

                {/* Data Section */}
                <motion.div variants={itemVariants}>
                    <Section title="Data Management">
                        <div className="grid grid-cols-2 divide-x divide-zinc-800/50 border-b border-zinc-800/50">
                            <div className="p-4 text-center">
                                <div className="text-3xl font-black text-white">{historyLength}</div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Sessions</div>
                            </div>
                            <div className="p-4 text-center">
                                <div className="text-3xl font-black text-white">{routinesLength}</div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Routines</div>
                            </div>
                        </div>
                        
                        <Button
                            variant="ghost"
                            fullWidth
                            iconLeft={Download}
                            iconRight={ChevronRight}
                            className="justify-start py-6"
                            onClick={() => {}}
                        >
                            Export Data
                        </Button>

                        <Button
                            variant="ghost"
                            fullWidth
                            iconLeft={Upload}
                            iconRight={ChevronRight}
                            className="justify-start py-6"
                            onClick={() => {}}
                        >
                            Import Data
                        </Button>
                        
                        <Button
                            variant="danger"
                            fullWidth
                            iconLeft={Trash2}
                            className="justify-start py-6 border-none bg-transparent hover:bg-red-500/10"
                            onClick={() => {}}
                        >
                            Clear All Data
                        </Button>

                    </Section>
                </motion.div>

                {/* App Info */}
                <motion.div variants={itemVariants} className="text-center py-6 opacity-60">
                    <div className="font-bold text-[11px] text-zinc-500 tracking-wider">
                        TIVE STRENGTH OS
                    </div>
                    <div className="font-medium text-[9px] text-zinc-600 mt-1 uppercase tracking-widest">
                        v1.0.0 • Built by Kawe
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

// --- Subcomponents ---

const Section = ({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) => (
    <section>
        <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">
            {title}
        </h2>
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-zinc-800/50 shadow-sm">
            {children}
        </div>
        {description && <p className="text-[10px] text-zinc-600 px-3 mt-2">{description}</p>}
    </section>
);

const IconBox = ({ icon: Icon, color, iconColor = "text-white" }: { icon: any, color: string, iconColor?: string }) => (
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm", color)}>
        <Icon size={16} className={iconColor} />
    </div>
);

const SegmentedControl = ({ id, options, value, onChange }: { id: string, options: string[], value: string, onChange: (v: string) => void }) => {
    return (
        <div className="flex bg-zinc-950 rounded-xl p-1 w-full gap-1 border border-zinc-800/50">
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    className="relative flex-1 py-1.5 text-[10px] font-bold uppercase transition-colors rounded-lg cursor-pointer z-10"
                >
                    {value === option && (
                        <motion.div
                            layoutId={`pill-${id}`}
                            className="absolute inset-0 bg-zinc-800 rounded-lg shadow-sm border border-zinc-700/50"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className={cn("relative z-20 transition-colors", value === option ? "text-white" : "text-zinc-500 hover:text-zinc-300")}>
                        {option}
                    </span>
                </button>
            ))}
        </div>
    )
}

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button
        onClick={onChange}
        className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none active:scale-95 shadow-inner",
            checked ? "bg-brand-primary" : "bg-zinc-800"
        )}
    >
        <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md transition duration-200 ease-in-out",
                checked ? "translate-x-[22px] bg-black" : "translate-x-1 bg-zinc-400"
            )}
        />
    </button>
)

export default Settings;
