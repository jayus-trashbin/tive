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
    X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useUIStore } from '../store/useUIStore';
import { credentialsStore } from '../utils/credentialsStore';
import { cn } from '../lib/utils';
import { Button, ConfirmModal, IconButton } from './ui';
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

    const handleSyncNow = async () => {
        if (isSyncing) return;
        if (!isConnected) {
            addNotification(t('settings.toasts.configureSupabase'), 'error');
            return;
        }
        // SyncService emits its own success/error toast for user-initiated syncs.
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
            // Reset Zustand in-memory state first so UI doesn't display stale data during reload
            useWorkoutStore.getState().resetStorage?.();

            // Delete persisted Zustand storage in IDB
            await del('adaptive-strength-pro-db');

            // Delete photo IDB database
            try {
                indexedDB.deleteDatabase(PHOTO_DB_NAME);
            } catch (e) {
                logger.warn('Settings', 'Could not delete photo DB', e);
            }

            // Clear cached credentials
            credentialsStore.clear();

            addNotification(t('settings.toasts.cleared'), 'success');
            setTimeout(() => window.location.reload(), 600);
        } catch (e) {
            logger.error('Settings', 'Clear data failed', e);
            addNotification(t('settings.toasts.clearFailed'), 'error');
        }
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto px-4 pt-safe pb-32 no-scrollbar scroll-smooth">
            {/* Header */}
            <header className="shrink-0 mb-6 mt-2">
                <div className="flex items-center gap-2 mb-1">
                    <SettingsIcon size={16} className="text-brand-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                        {t('settings.headerTag')}
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    {t('settings.title')}
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

                {/* Profile / Identity Section */}
                <motion.div variants={itemVariants}>
                    <Section title={t('settings.sections.account')} description={t('settings.sections.accountDesc')}>
                        <div className="flex items-center gap-4 p-4 border-b border-zinc-800/50">
                            <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center shrink-0">
                                <span className="font-bold text-brand-primary text-lg">
                                    {userStats.name ? userStats.name.substring(0, 2).toUpperCase() : 'AT'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-white text-base truncate">
                                    {userStats.name || t('settings.account.athleteProfile')}
                                </div>
                                <div className="text-xs font-medium text-zinc-500 truncate">
                                    {userStats.bodyweight ? `${userStats.bodyweight} kg` : t('settings.account.noWeight')}
                                    {userStats.height ? ` • ${userStats.height} cm` : ''}
                                </div>
                            </div>
                        </div>

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
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                <input
                                    type="email"
                                    autoComplete="email"
                                    aria-label="Email Address"
                                    placeholder="Email Address"
                                    value={userStats.email || ''}
                                    onChange={(e) => updateUserStats({ email: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-brand-primary focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="settings-bodyweight" className="text-[10px] font-bold text-zinc-500 uppercase ml-1 block mb-1">
                                        Bodyweight (kg)
                                    </label>
                                    <input
                                        id="settings-bodyweight"
                                        type="number"
                                        step="0.1"
                                        value={userStats.bodyweight}
                                        onChange={(e) => updateUserStats({ bodyweight: Number(e.target.value) })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm font-medium focus:border-brand-primary focus:outline-none transition-colors text-center"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 block mb-1">Gender</label>
                                    <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800" role="radiogroup" aria-label="Select Gender">
                                        {(['male', 'female'] as const).map(g => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => updateUserStats({ gender: g })}
                                                aria-pressed={userStats.gender === g}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all",
                                                    userStats.gender === g ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                                )}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>
                </motion.div>

                {/* Sync & Backup Section (Supabase setup inline) */}
                <motion.div variants={itemVariants}>
                    <Section title={t('settings.sections.sync')} description={t('settings.sections.syncDesc')}>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Cloud} color="bg-blue-500" />
                                <div>
                                    <div className="text-sm font-bold text-white">{t('settings.sync.supabaseLabel')}</div>
                                    <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                                        {isConnected ? (
                                            <><CheckCircle2 size={11} className="text-brand-success" /> {t('settings.sync.connected')}</>
                                        ) : (
                                            <><AlertCircle size={11} /> {t('settings.sync.notConfigured')}</>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowSqlHelp(!showSqlHelp)}
                                className="text-[10px] font-bold text-brand-primary flex items-center gap-1 hover:underline"
                            >
                                <Info size={12} /> Setup
                            </button>
                        </div>

                        {showSqlHelp && (
                            <div className="px-4 pb-4">
                                <div className="bg-black/50 rounded-xl border border-brand-primary/20 p-3 space-y-2">
                                    <p className="text-[10px] text-zinc-400">
                                        Create a free project at <span className="text-white">supabase.com</span>, open the <strong className="text-white">SQL Editor</strong>, and run:
                                    </p>
                                    <div className="bg-zinc-950 p-2 rounded-lg border border-white/10 relative">
                                        <pre className="text-[9px] font-medium text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-32">
                                            {SUPABASE_SQL_SCHEMA}
                                        </pre>
                                        <button
                                            type="button"
                                            onClick={handleCopySql}
                                            aria-label="Copy SQL"
                                            className="absolute top-2 right-2 p-1.5 bg-zinc-800 rounded-md text-zinc-400 hover:text-white"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-4 space-y-3">
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                <input
                                    type="text"
                                    aria-label="Supabase Project URL"
                                    placeholder="Supabase Project URL"
                                    value={supabaseDraft.url}
                                    onChange={(e) => setSupabaseDraft({ ...supabaseDraft, url: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white text-xs font-medium focus:border-brand-primary focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                <input
                                    type={showSupabaseKey ? 'text' : 'password'}
                                    aria-label="Supabase Anon Key"
                                    placeholder="Supabase Anon Key"
                                    value={supabaseDraft.key}
                                    onChange={(e) => setSupabaseDraft({ ...supabaseDraft, key: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-white text-xs font-medium focus:border-brand-primary focus:outline-none transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                                    aria-label={showSupabaseKey ? 'Hide Supabase key' : 'Show Supabase key'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
                                >
                                    {showSupabaseKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            <Button
                                variant="primary"
                                size="sm"
                                fullWidth
                                onClick={handleSaveSupabase}
                                loading={supabaseTesting}
                                disabled={supabaseTesting || (!supabaseDraft.url && !supabaseDraft.key)}
                            >
                                {supabaseTesting ? 'Validating…' : (isConnected ? t('common.edit') : t('common.setup'))}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0"><RefreshCw size={18} /></div>
                                <div>
                                    <div className="text-sm font-bold text-white">{t('settings.sync.lastSync')}</div>
                                    <div className="text-[11px] text-zinc-500">{lastSync}</div>
                                    {lastSyncError && (
                                        <div className="text-[10px] text-brand-danger mt-0.5 max-w-[180px] truncate">
                                            {lastSyncError}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                iconLeft={RefreshCw}
                                onClick={handleSyncNow}
                                disabled={isSyncing || !isConnected}
                                loading={isSyncing}
                            >
                                {isSyncing ? t('settings.sync.syncing') : t('settings.sync.syncNow')}
                            </Button>
                        </div>
                    </Section>
                </motion.div>

                {/* Assistant Section */}
                <motion.div variants={itemVariants}>
                    <Section title={t('settings.sections.aiAssistant')} description={t('settings.sections.aiAssistantDesc')}>
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <IconBox icon={Sparkles} color="bg-purple-500" />
                                <label htmlFor="gemini-api-key" className="text-sm font-bold text-white cursor-pointer">
                                    {t('settings.ai.geminiKeyLabel')}
                                </label>
                            </div>
                            <input
                                id="gemini-api-key"
                                type="password"
                                value={userStats.geminiApiKey || ''}
                                onChange={(e) => {
                                    useWorkoutStore.getState().updateUserStats({ geminiApiKey: e.target.value });
                                    credentialsStore.setGeminiKey(e.target.value);
                                }}
                                placeholder="AIzaSy..."
                                aria-label={t('settings.ai.geminiKeyLabel')}
                                className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none rounded-xl transition-all"
                            />
                            <div className="text-[10px] text-zinc-500 mt-2 ml-1">
                                {t('settings.ai.getKeyHint')}{' '}
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">
                                    {t('settings.ai.googleAIStudio')}
                                </a>
                            </div>
                        </div>
                    </Section>
                </motion.div>

                {/* Preferences Section */}
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
                    </Section>
                </motion.div>

                {/* Audio & Haptics Section */}
                <motion.div variants={itemVariants}>
                    <Section title={t('settings.sections.audio')} description={t('settings.sections.audioDesc')}>
                        <div className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <IconBox icon={Volume2} color={userStats.isAudioEnabled !== false ? "bg-brand-primary" : "bg-zinc-600"} iconColor={userStats.isAudioEnabled !== false ? "text-black" : "text-white"} />
                                <div>
                                    <div className="text-sm font-bold text-white">{t('settings.audio.appSounds')}</div>
                                    <div className="text-[11px] text-zinc-500">{t('settings.audio.appSoundsDesc')}</div>
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
                                    <div className="text-[11px] text-zinc-500 max-w-[200px]">{t('settings.audio.smartAudioDesc')}</div>
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
                                    <div className="text-[11px] text-zinc-500">{t('settings.audio.hapticDesc')}</div>
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
                    <Section title={t('settings.sections.data')}>
                        <div className="grid grid-cols-2 divide-x divide-zinc-800/50 border-b border-zinc-800/50">
                            <div className="p-4 text-center">
                                <div className="text-3xl font-black text-white">{historyLength}</div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">{t('settings.data.sessions')}</div>
                            </div>
                            <div className="p-4 text-center">
                                <div className="text-3xl font-black text-white">{routinesLength}</div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">{t('settings.data.routines')}</div>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            fullWidth
                            iconLeft={Download}
                            iconRight={ChevronRight}
                            className="justify-start py-6"
                            onClick={handleExport}
                        >
                            {t('settings.data.exportJson')}
                        </Button>

                        <Button
                            variant="ghost"
                            fullWidth
                            iconLeft={Download}
                            iconRight={ChevronRight}
                            className="justify-start py-6"
                            onClick={handleExportCSV}
                        >
                            {t('settings.data.exportCsv')}
                        </Button>

                        <Button
                            variant="ghost"
                            fullWidth
                            iconLeft={Upload}
                            iconRight={ChevronRight}
                            className="justify-start py-6"
                            onClick={handleImportClick}
                        >
                            {t('settings.data.importBackup')}
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

                        <Button
                            variant="danger"
                            fullWidth
                            iconLeft={Trash2}
                            className="justify-start py-6 border-none bg-transparent hover:bg-red-500/10"
                            onClick={() => setConfirmClear(true)}
                        >
                            {t('settings.data.clearAll')}
                        </Button>

                    </Section>
                </motion.div>

                {/* App Info */}
                <motion.div variants={itemVariants} className="text-center py-6 opacity-60">
                    <div className="font-bold text-[11px] text-zinc-500 tracking-wider">
                        {t('settings.appInfo.brand')}
                    </div>
                    <div className="font-medium text-[9px] text-zinc-600 mt-1 uppercase tracking-widest">
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
                    className="relative flex-1 py-1.5 text-[10px] font-bold uppercase transition-colors rounded-lg cursor-pointer z-10"
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
