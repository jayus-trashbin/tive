import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ClipboardList, History, Image, BookOpen, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useUIStore } from "../store/useUIStore";
import type { TabId } from '../types';
import { useTranslation } from '../i18n';
import { useMotion } from '../hooks/useMotion';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

interface TabConfig {
    id: TabId;
    icon: typeof Home;
    label: string;
}

/**
 * Navigation Command Bar — Floating Pill
 */
const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
    const { activeSession } = useWorkoutStore();
    const { isMinimized, isRoutineEditorOpen, isRoutinePreviewOpen, isSettingsOpen, setSettingsOpen } = useUIStore();
    const { t } = useTranslation();
    const { shouldReduceMotion } = useMotion();

    const tabs: TabConfig[] = [
        { id: 'dashboard', icon: Home, label: t('tabs.home') },
        { id: 'plans', icon: ClipboardList, label: t('tabs.routines') },
        { id: 'analytics', icon: BarChart3, label: t('tabs.lab') },
        { id: 'history', icon: History, label: t('tabs.history') },
    ];

    const isVisible = (!activeSession || (activeSession && isMinimized)) &&
        !isRoutineEditorOpen &&
        !isRoutinePreviewOpen &&
        !isSettingsOpen;

    const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
    React.useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className="flex justify-center h-[100dvh] w-full overflow-hidden bg-black">
            <div className="w-full max-w-lg md:max-w-2xl h-full flex flex-col relative bg-zinc-950 shadow-2xl sm:border-x sm:border-zinc-800 overflow-hidden">

                {/* Main Content Area */}
                <main className="flex-1 relative w-full h-full z-0 bg-zinc-950">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
                            className="w-full h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>

                    {/* Offline Banner */}
                    <AnimatePresence>
                        {isOffline && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-[env(safe-area-inset-top)] left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full z-[100] flex items-center gap-2 shadow-lg"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-caption-xs font-bold text-zinc-400 uppercase tracking-wider">Modo Offline</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom Gradient Mask */}
                    <div className={cn(
                        "absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-10 transition-opacity duration-300",
                        isVisible ? "opacity-100" : "opacity-0"
                    )} />
                </main>

                {/* BOTTOM TAB BAR */}
                <motion.div
                    initial={false}
                    animate={{
                        y: isVisible ? 0 : 100,
                        opacity: isVisible ? 1 : 0
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", damping: 28, stiffness: 320 }}
                    className="absolute bottom-0 left-0 right-0 z-50 flex justify-center w-full"
                >
                    <nav
                        role="navigation"
                        aria-label="Navegação principal"
                        className="
                            w-full h-[64px] pb-[env(safe-area-inset-bottom)]
                            bg-zinc-900 border-t border-zinc-800/50
                            flex items-center justify-around
                        "
                    >
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        if (navigator.vibrate) navigator.vibrate(5);
                                        onTabChange(tab.id);
                                    }}
                                    aria-label={tab.label}
                                    aria-current={isActive ? 'page' : undefined}
                                    className="relative flex-1 h-full flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                                >
                                    <tab.icon
                                        size={22}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={cn(
                                            "transition-all duration-200",
                                            isActive ? "text-brand-primary drop-shadow-[0_0_6px_currentColor]" : "text-zinc-500"
                                        )}
                                    />
                                    <span className={cn(
                                        "text-caption-xs font-medium transition-colors duration-200",
                                        isActive ? "text-brand-primary" : "text-zinc-500"
                                    )}>
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}

                        {/* "More" tab */}
                        <MoreTab
                            isPhotosActive={activeTab === 'photos'}
                            isLibraryActive={activeTab === 'library'}
                            onNavigatePhotos={() => { if (navigator.vibrate) navigator.vibrate(5); onTabChange('photos'); }}
                            onNavigateLibrary={() => { if (navigator.vibrate) navigator.vibrate(5); onTabChange('library'); }}
                            onOpenSettings={() => { if (navigator.vibrate) navigator.vibrate(5); setSettingsOpen(true); }}
                            moreLabel={t('tabs.more')}
                            photosLabel={t('tabs.photos')}
                            libraryLabel={t('tabs.library')}
                        />
                    </nav>
                </motion.div>
            </div>
        </div>
    );
};

interface MoreTabProps {
    isPhotosActive: boolean;
    isLibraryActive: boolean;
    onNavigatePhotos: () => void;
    onNavigateLibrary: () => void;
    onOpenSettings: () => void;
    moreLabel: string;
    photosLabel: string;
    libraryLabel: string;
}

const MoreTab: React.FC<MoreTabProps> = ({
    isPhotosActive, isLibraryActive, onNavigatePhotos, onNavigateLibrary, onOpenSettings, moreLabel, photosLabel, libraryLabel
}) => {
    const [open, setOpen] = React.useState(false);
    const { shouldReduceMotion } = useMotion();

    React.useEffect(() => { if (isPhotosActive || isLibraryActive) setOpen(false); }, [isPhotosActive, isLibraryActive]);

    const isHighlighted = isPhotosActive || isLibraryActive;

    return (
        <>
            <button
                id="nav-more-btn"
                onClick={() => { if (navigator.vibrate) navigator.vibrate(5); setOpen(v => !v); }}
                aria-label={moreLabel}
                aria-expanded={open}
                aria-haspopup="menu"
                className="relative flex-1 h-full flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            >
                {isHighlighted && (
                    <span className="absolute top-2.5 right-[calc(50%-14px)] w-1.5 h-1.5 rounded-full bg-brand-primary" />
                )}
                <MoreIcon size={22} highlighted={isHighlighted || open} />
                <span className={cn(
                    "text-caption-xs font-medium transition-colors duration-200",
                    isHighlighted || open ? "text-brand-primary" : "text-zinc-500"
                )}>
                    {moreLabel}
                </span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        key="more-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15 }}
                        className="fixed inset-0 z-dropdown bg-black/60 backdrop-blur-[2px]"
                        onClick={() => setOpen(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {open && (
                    <motion.div
                        key="more-sheet"
                        role="menu"
                        aria-label={moreLabel}
                        initial={shouldReduceMotion ? { y: 0, opacity: 0 } : { y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={shouldReduceMotion ? { y: 0, opacity: 0 } : { y: '100%', opacity: 0 }}
                        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', damping: 28, stiffness: 320 }}
                        className="fixed bottom-[64px] left-0 right-0 z-dropdown flex justify-center"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 51 }}
                    >
                        <div className="w-full max-w-lg md:max-w-2xl bg-zinc-900 border-t border-zinc-800/60 p-4 flex gap-3">
                            <MoreSheetCard
                                id="more-sheet-library"
                                icon={<BookOpen size={20} />}
                                label={libraryLabel}
                                isActive={isLibraryActive}
                                onClick={() => { setOpen(false); onNavigateLibrary(); }}
                            />
                            <MoreSheetCard
                                id="more-sheet-photos"
                                icon={<Image size={20} />}
                                label={photosLabel}
                                isActive={isPhotosActive}
                                onClick={() => { setOpen(false); onNavigatePhotos(); }}
                            />
                            <MoreSheetCard
                                id="more-sheet-settings"
                                icon={<SettingsIcon size={20} />}
                                label="Settings"
                                isActive={false}
                                onClick={() => { setOpen(false); onOpenSettings(); }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const MoreIcon: React.FC<{ size: number; highlighted: boolean }> = ({ size, highlighted }) => (
    <svg
        width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={highlighted ? 'var(--color-brand-primary, #bef264)' : '#71717a'}
        className="transition-all duration-200"
        style={{ filter: highlighted ? 'drop-shadow(0 0 6px currentColor)' : 'none' }}
    >
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
);

const MoreSheetCard: React.FC<{
    id: string;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ id, icon, label, isActive, onClick }) => (
    <button
        id={id}
        onClick={onClick}
        role="menuitem"
        className={cn(
            "flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all active:scale-95",
            isActive
                ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]"
                : "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        )}
    >
        {icon}
        <span className="text-xs font-bold">{label}</span>
    </button>
);

export default Layout;
