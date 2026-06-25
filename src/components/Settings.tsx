import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings as SettingsIcon,
    Cloud,
    Palette,
    Languages,
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
    Ruler,
    User,
    Mail,
    Activity,
    Globe,
    Key,
    Eye,
    EyeOff,
    Info,
    Copy,
    X,
    Bell,
    Dumbbell,
    Layout
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useUIStore } from '../store/useUIStore';
import { requestNotificationPermission } from '../utils/reminders';
import { credentialsStore } from '../utils/credentialsStore';
import { cn } from '../lib/utils';
import { Button, ConfirmModal, IconButton } from './ui';
import { Page } from './ui/Page';
import { AppHeader } from './ui/AppHeader';
import { syncService } from '../services/SyncService';
import { photoSyncService } from '../services/PhotoSyncService';
import { downloadJSON, parseBackupJSON, exportToCSV, downloadCSV } from '../utils/exportImport';
import type { Session, Exercise } from '../types';
import { PHOTO_DB_NAME } from '../types/photo';
import { del } from 'idb-keyval';
import { logger } from '../utils/logger';
import { useTranslation } from '../i18n';
import type { Language } from '../i18n';
import { useFocusTrap } from '../hooks/useFocusTrap';

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
};

type ThemeMode = 'dark' | 'oled';

const SUPABASE_SQL_SCHEMA = `-- Run this in your Supabase SQL Editor to enable Cloud Sync

create table if not exists sessions (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone,
  json_data jsonb not null
);

create table if not exists routines (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone,
  json_data jsonb not null
);

create table if not exists exercises (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone,
  json_data jsonb not null
);

alter table sessions enable row level security;
alter table routines enable row level security;
alter table exercises enable row level security;

create policy "Allow Access Sessions" on sessions for all using (true) with check (true);
create policy "Allow Access Routines" on routines for all using (true) with check (true);
create policy "Allow Access Exercises" on exercises for all using (true) with check (true);
`;

/**
 * Settings Page
 * Premium configuration with grouped lists and sleek micro-interactions.
 */
const Settings: React.FC = () => {
    const { t, lang } = useTranslation();
    const userStats = useWorkoutStore(state => state.userStats);
    const updateUserStats = useWorkoutStore(state => state.updateUserStats);
    const historyLength = useWorkoutStore(state => state.history.length);
    const routinesLength = useWorkoutStore(state => state.routines.length);
    const isSyncing = useUIStore(state => state.isSyncing);
    const lastSyncError = useUIStore(state => state.lastSyncError);
    const addNotification = useUIStore(state => state.addNotification);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [pendingImport, setPendingImport] = useState<{ sessions: Session[]; exercises: Exercise[] } | null>(null);
    const [confirmClear, setConfirmClear] = useState(false);
    const [showSupabaseKey, setShowSupabaseKey] = useState(false);
    const [showSqlHelp, setShowSqlHelp] = useState(false);
    const [isEditingCloud, setIsEditingCloud] = useState(false);
    const [isEditingGemini, setIsEditingGemini] = useState(false);
    
    const [supabaseDraft, setSupabaseDraft] = useState({
        url: userStats.supabaseUrl || '',
        key: userStats.supabaseKey || '',
    });
    const [supabaseTesting, setSupabaseTesting] = useState(false);

    const lastSync = userStats.lastSyncTime
        ? new Date(userStats.lastSyncTime).toLocaleString(lang === 'pt-BR' ? 'pt-BR' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : t('common.never');

    const isConnected = !!(userStats.supabaseUrl && userStats.supabaseKey);
    const isGeminiConnected = !!userStats.geminiApiKey;

    const handleSyncNow = async () => {
        if (isSyncing) return;
        if (!isConnected) {
            addNotification(t('settings.toasts.configureSupabase'), 'error');
            return;
        }
        await syncService.sync();
    };

    const handleThemeChange = (value: ThemeMode) => {
        useWorkoutStore.getState().updateUserStats({ theme: value });
    };

    const handleUnitsChange = (value: 'metric' | 'imperial') => {
        useWorkoutStore.getState().updateUserStats({ unitSystem: value });
    };

    const handleLanguageChange = (value: Language) => {
        useWorkoutStore.getState().updateUserStats({ language: value });
    };

    const handleDensityChange = (value: 'comfortable' | 'compact') => {
        useWorkoutStore.getState().updateUserStats({ density: value });
    };

    const handleSaveSupabase = async () => {
        const { url, key } = supabaseDraft;
        if (!url || !key) {
            addNotification(t('settings.toasts.configureSupabase'), 'error');
            return;
        }
        setSupabaseTesting(true);
        try {
            updateUserStats({ supabaseUrl: url, supabaseKey: key });
            credentialsStore.setSupabase(url, key);
            syncService.reset();
            photoSyncService.reset();

            const ok = await syncService.validateConnection(url, key);
            if (ok) {
                addNotification('Cloud connection saved', 'success');
                setIsEditingCloud(false);
                syncService.sync();
            } else {
                addNotification('Connection failed. Check URL/Key.', 'error');
            }
        } catch (e) {
            logger.error('Settings', 'Supabase save failed', e);
            addNotification('Could not save credentials', 'error');
        } finally {
            setSupabaseTesting(false);
        }
    };

    const handleCopySql = () => {
        navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
        addNotification('SQL copied to clipboard', 'success');
    };

    const handleExport = () => {
        try {
            const { history, exercises, routines } = useWorkoutStore.getState();
            const stamp = new Date().toISOString().split('T')[0];
            downloadJSON(
                {
                    version: 1,
                    exportedAt: Date.now(),
                    history,
                    exercises,
                    routines,
                },
                `tive-backup-${stamp}.json`
            );
            addNotification(t('settings.toasts.backupExported'), 'success');
        } catch (e) {
            logger.error('Settings', 'Export failed', e);
            addNotification(t('settings.toasts.exportFailed'), 'error');
        }
    };

    const handleExportCSV = () => {
        try {
            const { history, exercises } = useWorkoutStore.getState();
            if (history.length === 0) {
                addNotification(t('settings.toasts.noSessionsCsv'), 'error');
                return;
            }
            const csv = exportToCSV(history, exercises);
            const stamp = new Date().toISOString().split('T')[0];
            downloadCSV(csv, `tive-sessions-${stamp}.csv`);
            addNotification(t('settings.toasts.csvExported'), 'success');
        } catch (e) {
            logger.error('Settings', 'CSV export failed', e);
            addNotification(t('settings.toasts.csvExportFailed'), 'error');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = parseBackupJSON(String(reader.result || ''));
            if (result.error) {
                addNotification(result.error, 'error');
                return;
            }
            setPendingImport({ sessions: result.sessions, exercises: result.exercises });
        };
        reader.onerror = () => addNotification(t('settings.toasts.couldNotRead'), 'error');
        reader.readAsText(file);
    };

    const handleImportConfirm = () => {
        if (!pendingImport) return;
        try {
            useWorkoutStore.getState().mergeRemoteData(pendingImport.sessions, [], pendingImport.exercises);
            addNotification(
                t('settings.toasts.imported', {
                    count: pendingImport.sessions.length,
                    ex: pendingImport.exercises.length,
                }),
                'success'
            );
        } catch (e) {
            logger.error('Settings', 'Import merge failed', e);
            addNotification(t('settings.toasts.importFailed'), 'error');
        } finally {
            setPendingImport(null);
        }
    };

    const handleClearConfirm = async () => {
        setConfirmClear(false);
        try {
            useWorkoutStore.getState().resetStorage?.();
            await del('adaptive-strength-pro-db');
            try {
                indexedDB.deleteDatabase(PHOTO_DB_NAME);
            } catch (e) {
                logger.warn('Settings', 'Could not delete photo DB', e);
            }
            credentialsStore.clear();

            addNotification(t('settings.toasts.cleared'), 'success');
            setTimeout(() => window.location.reload(), 600);
        } catch (e) {
            logger.error('Settings', 'Clear data failed', e);
            addNotification(t('settings.toasts.clearFailed'), 'error');
        }
    };

    return (
        <Page className="flex-1 px-page">
            {/* Header */}
            <AppHeader>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <SettingsIcon size={16} className="text-brand-primary" />
                        <span className="text-caption-xs font-bold uppercase tracking-widest text-zinc-500">
                            {t('settings.headerTag')}
                        </span>
                    </div>
                    <h1 className="text-h1 font-bold text-white tracking-tight">
                        {t('settings.title')}
                    </h1>
                </div>
            </AppHeader>

            <motion.div
                className="space-y-6"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: {
                        transition: { staggerChildren: 0.05 }
                    }
                }}
            >
                {/* 1. Quick Preferences */}
                <motion.div variants={itemVariants}>
                    <Section title={t('settings.sections.preferences')}>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Palette} color="bg-orange-500" />
                                <div className="text-sm font-bold text-white">{t('settings.prefs.theme')}</div>
                            </div>
                            <div className="w-48">
                                <SegmentedControl
                                    id="theme"
                                    options={[
                                        { value: 'dark', label: t('settings.prefs.themeDark') },
                                        { value: 'oled', label: t('settings.prefs.themeOled') },
                                    ]}
                                    value={userStats.theme ?? 'dark'}
                                    onChange={(v) => handleThemeChange(v as ThemeMode)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Languages} color="bg-sky-500" />
                                <div className="text-sm font-bold text-white">{t('settings.prefs.language')}</div>
                            </div>
                            <div className="w-44">
                                <SegmentedControl
                                    id="language"
                                    options={[
                                        { value: 'en', label: t('settings.prefs.langEnglish') },
                                        { value: 'pt-BR', label: t('settings.prefs.langPortuguese') },
                                    ]}
                                    value={lang}
                                    onChange={(v) => handleLanguageChange(v as Language)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Ruler} color="bg-emerald-500" />
                                <div className="text-sm font-bold text-white">{t('settings.prefs.units')}</div>
                            </div>
                            <div className="w-32">
                                <SegmentedControl
                                    id="units"
                                    options={[
                                        { value: 'metric', label: t('settings.prefs.unitsKg') },
                                        { value: 'imperial', label: t('settings.prefs.unitsLbs') },
                                    ]}
                                    value={userStats.unitSystem ?? 'metric'}
                                    onChange={(v) => handleUnitsChange(v as 'metric' | 'imperial')}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Layout} color="bg-indigo-500" />
                                <div className="text-sm font-bold text-white">{t('settings.prefs.density')}</div>
                            </div>
                            <div className="w-48">
                                <SegmentedControl
                                    id="density"
                                    options={[
                                        { value: 'comfortable', label: t('settings.prefs.densityComfortable') },
                                        { value: 'compact', label: t('settings.prefs.densityCompact') },
                                    ]}
                                    value={userStats.density ?? 'comfortable'}
                                    onChange={(v) => handleDensityChange(v as 'comfortable' | 'compact')}
                                />
                            </div>
                        </div>
                    </Section>
                </motion.div>

                {/* 2. Profile */}
                <motion.div variants={itemVariants}>
                    <Section title={t('settings.sections.account')} description={t('settings.sections.accountDesc')}>
                        <div className="p-4 space-y-3">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                <input
                                    type="text"
                                    autoComplete="name"
                                    aria-label="Your Name"
                                    placeholder="Your Name"
                                    value={userStats.name || ''}
                                    onChange={(e) => updateUserStats({ name: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-brand-primary focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <div>
                                    <label htmlFor="settings-bodyweight" className="text-caption-xs font-bold text-zinc-500 uppercase ml-1 block mb-1">
                                        Bodyweight (kg)
                                    </label>
                                    <input
                                        id="settings-bodyweight"
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,]*"
                                        step="0.1"
                                        value={userStats.bodyweight || ''}
                                        onChange={(e) => updateUserStats({ bodyweight: Number(e.target.value) })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm font-medium focus:border-brand-primary focus:outline-none transition-colors text-center"
                                    />
                                </div>
                                <div>
                                    <label className="text-caption-xs font-bold text-zinc-500 uppercase ml-1 block mb-1">Gender</label>
                                    <SegmentedControl
                                        id="gender"
                                        options={[
                                            { value: 'male', label: 'Male' },
                                            { value: 'female', label: 'Female' },
                                        ]}
                                        value={userStats.gender || 'male'}
                                        onChange={(v) => updateUserStats({ gender: v as 'male' | 'female' })}
                                    />
                                </div>
                            </div>
                        </div>
                    </Section>
                </motion.div>

                {/* 3. Audio & Haptics */}
                <motion.div variants={itemVariants}>
                    <Section title={t('settings.sections.audio')} description={t('settings.sections.audioDesc')}>
                        <div className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Volume2} color={userStats.isAudioEnabled !== false ? "bg-brand-primary" : "bg-zinc-600"} iconColor={userStats.isAudioEnabled !== false ? "text-black" : "text-white"} />
                                <div>
                                    <div className="text-sm font-bold text-white">{t('settings.audio.appSounds')}</div>
                                    <div className="text-caption text-zinc-500">{t('settings.audio.appSoundsDesc')}</div>
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
                                    <div className="text-sm font-bold text-white">{t('settings.audio.smartAudio')}</div>
                                    <div className="text-caption text-zinc-500 max-w-[200px]">{t('settings.audio.smartAudioDesc')}</div>
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
                                    <div className="text-sm font-bold text-white">{t('settings.audio.haptic')}</div>
                                    <div className="text-caption text-zinc-500">{t('settings.audio.hapticDesc')}</div>
                                </div>
                            </div>
                            <Toggle
                                checked={userStats.isVibrationEnabled !== false}
                                onChange={() => useWorkoutStore.getState().updateUserStats({ isVibrationEnabled: userStats.isVibrationEnabled === false ? true : false })}
                            />
                        </div>

                        {/* C-03: Gym Mode toggle */}
                        <div className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Dumbbell} color={userStats.gymMode ? "bg-brand-primary" : "bg-zinc-600"} iconColor={userStats.gymMode ? "text-black" : "text-white"} />
                                <div>
                                    <div className="text-sm font-bold text-white">{t('settings.prefs.gymMode')}</div>
                                    <div className="text-caption text-zinc-500">{t('settings.prefs.gymModeDesc')}</div>
                                </div>
                            </div>
                            <Toggle
                                checked={!!userStats.gymMode}
                                onChange={() => useWorkoutStore.getState().updateUserStats({ gymMode: !userStats.gymMode })}
                            />
                        </div>
                    </Section>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Section title="Reminders" description="Never miss a workout with local notifications.">
                        <div className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Bell} color={userStats.reminderSettings?.enabled ? "bg-brand-primary" : "bg-zinc-600"} iconColor={userStats.reminderSettings?.enabled ? "text-black" : "text-white"} />
                                <div>
                                    <div className="text-sm font-bold text-white">Workout Reminders</div>
                                    <div className="text-caption text-zinc-500">Get notified when it's time to train</div>
                                </div>
                            </div>
                            <Toggle
                                checked={!!userStats.reminderSettings?.enabled}
                                onChange={async () => {
                                    const current = !!userStats.reminderSettings?.enabled;
                                    if (!current) {
                                        const granted = await requestNotificationPermission();
                                        if (!granted) {
                                            useUIStore.getState().addNotification('Notification permission denied', 'error');
                                            return;
                                        }
                                    }
                                    useWorkoutStore.getState().updateUserStats({
                                        reminderSettings: {
                                            enabled: !current,
                                            time: userStats.reminderSettings?.time || '18:00',
                                            days: userStats.reminderSettings?.days || [1, 3, 5]
                                        }
                                    });
                                }}
                            />
                        </div>

                        {userStats.reminderSettings?.enabled && (
                            <div className="p-4 pt-0 space-y-4">
                                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 space-y-3">
                                    <div>
                                        <label className="text-caption-xs font-bold text-zinc-400 uppercase ml-1 block mb-2">Days of week</label>
                                        <div className="flex gap-1 justify-between">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                                                const isSelected = userStats.reminderSettings?.days.includes(idx);
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            const days = userStats.reminderSettings?.days || [];
                                                            const newDays = isSelected ? days.filter(d => d !== idx) : [...days, idx];
                                                            useWorkoutStore.getState().updateUserStats({
                                                                reminderSettings: { ...userStats.reminderSettings!, days: newDays }
                                                            });
                                                        }}
                                                        className={cn(
                                                            "w-10 h-10 rounded-lg text-xs font-bold transition-colors",
                                                            isSelected ? "bg-brand-primary text-black" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                                                        )}
                                                    >
                                                        {day}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-caption-xs font-bold text-zinc-400 uppercase ml-1 block mb-1">Time</label>
                                        <input
                                            type="time"
                                            value={userStats.reminderSettings?.time || '18:00'}
                                            onChange={(e) => {
                                                useWorkoutStore.getState().updateUserStats({
                                                    reminderSettings: { ...userStats.reminderSettings!, time: e.target.value }
                                                });
                                            }}
                                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:border-brand-primary focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </Section>
                </motion.div>

                {/* 4. Connections (Cloud Sync & AI) */}
                <motion.div variants={itemVariants}>
                    <Section title="Connections" description="Connect your app to the cloud and AI services">
                        
                        {/* Cloud Backup Item */}
                        <div className={cn("p-4 transition-all duration-300", !isConnected || isEditingCloud ? "bg-blue-500/5 border-b border-blue-500/20" : "border-b border-zinc-800/50")}>
                            {isConnected && !isEditingCloud ? (
                                // STATUS CARD: Connected
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">Cloud Backup Active</div>
                                            <div className="text-caption text-zinc-400">Last sync: {lastSync}</div>
                                            <button 
                                                onClick={() => setIsEditingCloud(true)}
                                                className="text-caption-xs text-zinc-500 hover:text-blue-400 hover:underline mt-0.5 text-left"
                                            >
                                                Edit connection settings
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        iconLeft={RefreshCw}
                                        onClick={handleSyncNow}
                                        disabled={isSyncing}
                                        loading={isSyncing}
                                    >
                                        {isSyncing ? t('settings.sync.syncing') : 'Sync Now'}
                                    </Button>
                                </div>
                            ) : (
                                // WIZARD: Not Connected or Editing
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                            <Cloud size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">Cloud Backup</div>
                                            <div className="text-caption text-zinc-400">Sync your data across devices securely.</div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                                        <div>
                                            <label className="text-caption-xs font-bold text-zinc-400 uppercase ml-1 block mb-1">Project URL</label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="https://your-project.supabase.co"
                                                    value={supabaseDraft.url}
                                                    onChange={(e) => setSupabaseDraft({ ...supabaseDraft, url: e.target.value })}
                                                    className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white text-xs font-medium focus:border-blue-500 focus:outline-none transition-colors"
                                                />
                                            </div>
                                            <p className="text-caption-xs text-zinc-500 mt-1 ml-1">Found in Supabase → Project Settings → API</p>
                                        </div>

                                        <div>
                                            <label className="text-caption-xs font-bold text-zinc-400 uppercase ml-1 block mb-1">Anon Key</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                                <input
                                                    type={showSupabaseKey ? 'text' : 'password'}
                                                    placeholder="eyJhbGciOiJIUzI1..."
                                                    value={supabaseDraft.key}
                                                    onChange={(e) => setSupabaseDraft({ ...supabaseDraft, key: e.target.value })}
                                                    className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-white text-xs font-medium focus:border-blue-500 focus:outline-none transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
                                                >
                                                    {showSupabaseKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                            <p className="text-caption-xs text-zinc-500 mt-1 ml-1">Found right below the Project URL</p>
                                        </div>

                                        {/* Database Setup Guide Accordion */}
                                        <div className="border border-zinc-800 rounded-xl overflow-hidden mt-2">
                                            <button 
                                                onClick={() => setShowSqlHelp(!showSqlHelp)}
                                                className="w-full flex items-center justify-between p-3 bg-zinc-900 text-caption font-bold text-zinc-400 hover:text-white transition-colors"
                                            >
                                                <span className="flex items-center gap-2"><Info size={14} /> Database Setup Guide</span>
                                                <ChevronRight size={14} className={cn("transition-transform duration-200", showSqlHelp && "rotate-90")} />
                                            </button>
                                            {showSqlHelp && (
                                                <div className="p-3 bg-black border-t border-zinc-800 space-y-2">
                                                    <p className="text-caption-xs text-zinc-400">
                                                        Run this in your Supabase SQL Editor to prepare your database:
                                                    </p>
                                                    <div className="bg-zinc-950 p-2 rounded-lg border border-white/10 relative">
                                                        <pre className="text-caption-xs font-medium text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-32">
                                                            {SUPABASE_SQL_SCHEMA}
                                                        </pre>
                                                        <button
                                                            type="button"
                                                            onClick={handleCopySql}
                                                            className="absolute top-2 right-2 p-1.5 bg-zinc-800 rounded-md text-zinc-400 hover:text-white tap"
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            {isEditingCloud && isConnected && (
                                                <Button variant="ghost" onClick={() => setIsEditingCloud(false)} className="flex-1">
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button
                                                variant="primary"
                                                className={cn("flex-1", !isEditingCloud || !isConnected ? "w-full" : "")}
                                                onClick={handleSaveSupabase}
                                                loading={supabaseTesting}
                                                disabled={supabaseTesting || (!supabaseDraft.url || !supabaseDraft.key)}
                                            >
                                                {supabaseTesting ? 'Connecting...' : 'Connect Supabase'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AI Assistant Item */}
                        <div className={cn("p-4 transition-all duration-300", !isGeminiConnected || isEditingGemini ? "bg-purple-500/5" : "")}>
                            {isGeminiConnected && !isEditingGemini ? (
                                // STATUS CARD: Connected
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                                            <Sparkles size={20} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">AI Assistant Active</div>
                                            <button 
                                                onClick={() => setIsEditingGemini(true)}
                                                className="text-caption-xs text-zinc-500 hover:text-purple-400 hover:underline mt-0.5 text-left"
                                            >
                                                Change API key
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // WIZARD: Not Connected or Editing
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                            <Sparkles size={20} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">AI Assistant</div>
                                            <div className="text-caption text-zinc-400">Unlock smart routine generation with Gemini.</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                                        <label className="text-caption-xs font-bold text-zinc-400 uppercase ml-1 block mb-1">Gemini API Key</label>
                                        <div className="relative flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                                <input
                                                    type="password"
                                                    value={userStats.geminiApiKey || ''}
                                                    onChange={(e) => {
                                                        useWorkoutStore.getState().updateUserStats({ geminiApiKey: e.target.value });
                                                        credentialsStore.setGeminiKey(e.target.value);
                                                    }}
                                                    placeholder="AIzaSy..."
                                                    className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white text-xs font-mono focus:border-purple-500 focus:outline-none transition-colors"
                                                />
                                            </div>
                                            {isEditingGemini && isGeminiConnected && (
                                                <Button size="sm" variant="primary" onClick={() => setIsEditingGemini(false)}>
                                                    Save
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-caption-xs text-zinc-500 mt-2 ml-1">
                                            Get your free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">Google AI Studio</a>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Section>
                </motion.div>

                {/* 5. Data & Storage */}
                <motion.div variants={itemVariants}>
                    <Section title={t('settings.sections.data')}>
                        <Button
                            variant="ghost"
                            fullWidth
                            iconLeft={Download}
                            iconRight={ChevronRight}
                            className="justify-start py-5 border-b border-zinc-800/50 rounded-none h-auto"
                            onClick={handleExport}
                        >
                            <div className="flex flex-col items-start ml-2 text-left">
                                <span className="font-bold leading-tight">{t('settings.data.exportJson')}</span>
                                <span className="text-caption-xs text-zinc-500 font-normal leading-tight mt-1">Export {historyLength} sessions & {routinesLength} routines</span>
                            </div>
                        </Button>

                        <Button
                            variant="ghost"
                            fullWidth
                            iconLeft={Download}
                            iconRight={ChevronRight}
                            className="justify-start py-5 border-b border-zinc-800/50 rounded-none h-auto"
                            onClick={handleExportCSV}
                        >
                            <div className="flex flex-col items-start ml-2 text-left">
                                <span className="font-bold leading-tight">{t('settings.data.exportCsv')}</span>
                                <span className="text-caption-xs text-zinc-500 font-normal leading-tight mt-1">Spreadsheet format for external tools</span>
                            </div>
                        </Button>

                        <Button
                            variant="ghost"
                            fullWidth
                            iconLeft={Upload}
                            iconRight={ChevronRight}
                            className="justify-start py-5 rounded-none h-auto"
                            onClick={handleImportClick}
                        >
                            <div className="flex flex-col items-start ml-2 text-left">
                                <span className="font-bold leading-tight">{t('settings.data.importBackup')}</span>
                                <span className="text-caption-xs text-zinc-500 font-normal leading-tight mt-1">Restore from a previous backup file</span>
                            </div>
                        </Button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            onChange={handleFileSelected}
                            aria-hidden="true"
                            tabIndex={-1}
                        />
                    </Section>
                </motion.div>

                {/* 6. Danger Zone */}
                <motion.div variants={itemVariants}>
                    <section>
                        <h2 className="text-caption font-bold text-red-500/80 uppercase tracking-widest px-2 mb-2">
                            Danger Zone
                        </h2>
                        <div className="bg-red-950/10 border border-red-900/30 rounded-2xl overflow-hidden p-1 shadow-sm">
                            <Button
                                variant="danger"
                                fullWidth
                                iconLeft={Trash2}
                                className="justify-start py-4 border-none bg-transparent hover:bg-red-500/10 text-red-500 h-auto"
                                onClick={() => setConfirmClear(true)}
                            >
                                <div className="flex flex-col items-start ml-2 text-left">
                                    <span className="font-bold leading-tight">{t('settings.data.clearAll')}</span>
                                    <span className="text-caption-xs text-red-400/70 font-normal leading-tight mt-1">Permanently delete all workouts and settings</span>
                                </div>
                            </Button>
                        </div>
                    </section>
                </motion.div>

                {/* App Info */}
                <motion.div variants={itemVariants} className="text-center py-6 opacity-60">
                    <div className="font-bold text-caption text-zinc-500 tracking-wider">
                        {t('settings.appInfo.brand')}
                    </div>
                    <div className="font-medium text-caption-xs text-zinc-600 mt-1 uppercase tracking-widest">
                        {t('settings.appInfo.version')}
                    </div>
                </motion.div>
            </motion.div>

            {/* Import confirmation */}
            <ConfirmModal
                open={!!pendingImport}
                title={t('settings.confirm.importTitle')}
                description={
                    pendingImport
                        ? t('settings.confirm.importDesc', {
                            count: pendingImport.sessions.length,
                            ex: pendingImport.exercises.length,
                        })
                        : undefined
                }
                confirmLabel={t('settings.confirm.importBtn')}
                cancelLabel={t('common.cancel')}
                onConfirm={handleImportConfirm}
                onCancel={() => setPendingImport(null)}
            />

            {/* Clear All Data confirmation */}
            <ConfirmModal
                open={confirmClear}
                title={t('settings.confirm.clearTitle')}
                description={t('settings.confirm.clearDesc')}
                confirmLabel={t('settings.confirm.clearBtn')}
                cancelLabel={t('common.cancel')}
                variant="danger"
                onConfirm={handleClearConfirm}
                onCancel={() => setConfirmClear(false)}
            />
        </Page>
    );
};

// --- Subcomponents ---

const Section = ({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) => (
    <section>
        <h2 className="text-caption font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">
            {title}
        </h2>
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-zinc-800/50 shadow-sm">
            {children}
        </div>
        {description && <p className="text-caption-xs text-zinc-600 px-3 mt-2">{description}</p>}
    </section>
);

const IconBox = ({ icon: Icon, color, iconColor = "text-white" }: { icon: LucideIcon, color: string, iconColor?: string }) => (
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm", color)}>
        <Icon size={16} className={iconColor} />
    </div>
);

interface SegmentedOption {
    value: string;
    label: string;
}

const SegmentedControl = ({ id, options, value, onChange }: { id: string, options: SegmentedOption[], value: string, onChange: (v: string) => void }) => {
    return (
        <div className="flex bg-zinc-950 rounded-xl p-1 w-full gap-1 border border-zinc-800/50" role="radiogroup" aria-label={id}>
            {options.map(option => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    role="radio"
                    aria-checked={value === option.value}
                    className="relative flex-1 py-1.5 text-caption-xs font-bold uppercase transition-colors rounded-lg cursor-pointer z-10"
                >
                    {value === option.value && (
                        <motion.div
                            layoutId={`pill-${id}`}
                            className="absolute inset-0 bg-zinc-800 rounded-lg shadow-sm border border-zinc-700/50"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className={cn("relative z-20 transition-colors", value === option.value ? "text-white" : "text-zinc-500 hover:text-zinc-300")}>
                        {option.label}
                    </span>
                </button>
            ))}
        </div>
    )
}

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button
        onClick={onChange}
        aria-pressed={checked}
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
