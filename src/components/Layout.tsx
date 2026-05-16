import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ClipboardList, History, Image } from 'lucide-react';
import { cn } from '../lib/utils';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useUIStore } from "../store/useUIStore";
import type { TabId } from '../types';
import { useTranslation } from '../i18n';

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
 * - Pill shape with frosted glass
 * - Active tab: icon + sliding label
 * - Inactive tabs: icon only
 * - Smooth layoutId animations
 */
const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
    const { activeSession } = useWorkoutStore();
    const { isMinimized, isRoutineEditorOpen, isRoutinePreviewOpen, isSettingsOpen } = useUIStore();
    const { t } = useTranslation();
    const tabs: TabConfig[] = [
        { id: 'dashboard', icon: Home, label: t('tabs.home') },
        { id: 'plans', icon: ClipboardList, label: t('tabs.routines') },
        { id: 'photos', icon: Image, label: t('tabs.photos') },
        { id: 'history', icon: History, label: t('tabs.history') },
    ];

    const isVisible = (!activeSession || (activeSession && isMinimized)) &&
        !isRoutineEditorOpen &&
        !isRoutinePreviewOpen &&
        !isSettingsOpen;

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
                            transition={{ duration: 0.2 }}
                            className="w-full h-full"
                        >
                            {children}
                        </motion.div>
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
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
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
                                        "text-[10px] font-medium transition-colors duration-200",
                                        isActive ? "text-brand-primary" : "text-zinc-500"
                                    )}>
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </motion.div>
            </div>
        </div>
    );
};

export default Layout;
