import React, { useRef } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { Home, ClipboardList, History, Image } from 'lucide-react';
import { cn } from '../lib/utils';
import { useWorkoutStore } from '../store/useWorkoutStore';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: 'dashboard' | 'workout' | 'exercises' | 'plans' | 'history' | 'analytics' | 'photos' | 'settings';
    onTabChange: (tab: 'dashboard' | 'workout' | 'exercises' | 'plans' | 'history' | 'analytics' | 'photos' | 'settings') => void;
}

/**
 * Navigation Command Bar — Floating Pill
 * - Pill shape with frosted glass
 * - Active tab: icon + sliding label
 * - Inactive tabs: icon only
 * - Smooth layoutId animations
 */
const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
    const { activeSession, isMinimized, isRoutineEditorOpen, isRoutinePreviewOpen, isProfileOpen } = useWorkoutStore();
    const navRef = useRef<HTMLDivElement>(null);

    const tabs = [
        { id: 'dashboard', icon: Home, label: 'Home' },
        { id: 'plans', icon: ClipboardList, label: 'Routines' },
        { id: 'photos', icon: Image, label: 'Photos' },
        { id: 'history', icon: History, label: 'History' },
    ];

    const isVisible = (!activeSession || (activeSession && isMinimized)) &&
        !isRoutineEditorOpen &&
        !isRoutinePreviewOpen &&
        !isProfileOpen;

    const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!navRef.current) return;
        const rect = navRef.current.getBoundingClientRect();
        const x = info.point.x - rect.left;
        const sectionWidth = rect.width / tabs.length;
        const index = Math.max(0, Math.min(tabs.length - 1, Math.floor(x / sectionWidth)));
        const targetTab = tabs[index].id as any;

        if (activeTab !== targetTab) {
            if (navigator.vibrate) navigator.vibrate(10);
            onTabChange(targetTab);
        }
    };

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

                {/* FLOATING PILL NAV */}
                <motion.div
                    initial={false}
                    animate={{
                        y: isVisible ? 0 : 100,
                        opacity: isVisible ? 1 : 0
                    }}
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
                    className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-6"
                    style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 12px) + 8px)` }}
                >
                    <div
                        ref={navRef}
                        className="pointer-events-auto w-full max-w-[340px]"
                    >
                        <motion.nav
                            onPan={handlePan}
                            className="
                                relative h-[56px]
                                bg-zinc-900/90 backdrop-blur-xl
                                border border-zinc-800/60
                                rounded-2xl
                                shadow-nav
                                flex items-center
                                px-1.5 transform-gpu
                            "
                        >
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            if (navigator.vibrate) navigator.vibrate(5);
                                            onTabChange(tab.id as any);
                                        }}
                                        className={cn(
                                            "relative h-[44px] flex items-center justify-center z-10 cursor-pointer transition-all duration-200",
                                            isActive ? "flex-[1.6]" : "flex-1"
                                        )}
                                    >
                                        {/* Active Background Pill */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="navActivePill"
                                                className="absolute inset-y-[4px] inset-x-[2px] z-0 bg-zinc-800/90 rounded-xl"
                                                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                                            />
                                        )}

                                        {/* Icon + Label */}
                                        <div className="relative z-10 flex items-center gap-1.5">
                                            <tab.icon
                                                size={20}
                                                strokeWidth={isActive ? 2.5 : 1.8}
                                                className={cn(
                                                    "transition-colors duration-200",
                                                    isActive ? "text-brand-primary" : "text-zinc-500"
                                                )}
                                            />

                                            {/* Animated Label — only visible on active */}
                                            <AnimatePresence mode="wait">
                                                {isActive && (
                                                    <motion.span
                                                        key={tab.id}
                                                        initial={{ opacity: 0, width: 0 }}
                                                        animate={{ opacity: 1, width: 'auto' }}
                                                        exit={{ opacity: 0, width: 0 }}
                                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                                        className="text-[11px] font-heading font-bold uppercase tracking-wide text-brand-primary overflow-hidden whitespace-nowrap"
                                                    >
                                                        {tab.label}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </button>
                                );
                            })}
                        </motion.nav>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Layout;
