import React, { useState, useEffect, Suspense, lazy } from 'react';
import { logger } from './utils/logger';
import { useWorkoutStore } from './store/useWorkoutStore';
import { useUIStore } from "./store/useUIStore";
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import WelcomeModal from './components/WelcomeModal';
import { MiniPlayer } from './components/active-session/MiniPlayer';
import { SplashScreen } from './components/ui/SplashScreen';
import PostWorkoutPrompt from './components/progress/PostWorkoutPrompt';
import { Notifications } from './components/ui/Notifications';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { FinishData } from './components/WorkoutPlayer';
import WorkoutSummary from './components/post-workout/WorkoutSummary';
import GlobalSearch from './components/ui/GlobalSearch';
import { X } from 'lucide-react';
import { checkAndTriggerReminders } from './utils/reminders';

// Lazy load heavy components for better initial load performance
const WorkoutPlayer = lazy(() => import('./components/WorkoutPlayer'));
const PlanManager = lazy(() => import('./components/PlanManager'));
const HistoryLog = lazy(() => import('./components/HistoryLog'));
const AnalyticsDashboard = lazy(() => import('./components/analytics/AnalyticsDashboard'));
const ProgressPhotos = lazy(() => import('./components/progress/ProgressPhotos'));
const Settings = lazy(() => import('./components/Settings'));
const ExerciseLibrary = lazy(() => import('./components/exercise/ExerciseLibrary'));

import HistorySkeleton from './components/ui/skeletons/HistorySkeleton';
import PlanSkeleton from './components/ui/skeletons/PlanSkeleton';
import { HistoryBoundary, WorkoutPlayerBoundary } from './components/ui/SectionBoundaries';
import type { TabId } from './types';

// Fallback for components with no dedicated skeleton (e.g. WorkoutPlayer)
const LazyFallback = () => (
  <div className="flex items-center justify-center h-full bg-black">
    <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

type View = TabId;

// Map views to indices for directional logic
const TAB_ORDER: Record<TabId, number> = {
  'dashboard': 0,
  'plans': 1,
  'analytics': 2,
  'library': 3,
  'history': 4,
  'photos': 5,
};

const App: React.FC = () => {
  // Use a tuple [currentView, direction] to track navigation direction
  const [[view, direction], setViewTuple] = useState<[View, number]>(['dashboard', 0]);

  const { activeSession, startSession, userStats } = useWorkoutStore();
    const { _hasHydrated, isMinimized, setHasHydrated, isSettingsOpen, setSettingsOpen } = useUIStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [finishData, setFinishData] = useState<FinishData | null>(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Helper to set view with direction calculation
  const setView = (newView: View) => {
    if (newView === view) return;
    const newIndex = TAB_ORDER[newView] ?? 0;
    const oldIndex = TAB_ORDER[view] ?? 0;
    const dir = newIndex > oldIndex ? 1 : -1;
    setViewTuple([newView, dir]);
  };

  // --- 1. FAILSAFE HYDRATION LOGIC ---
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!_hasHydrated) {
        logger.warn('App', 'Hydration took too long — forcing app entry');
        setHasHydrated(true);
      }
    }, 2000);

    return () => clearTimeout(safetyTimer);
  }, [_hasHydrated, setHasHydrated]);

  // --- 2. SMART STARTUP SEQUENCE ---
  useEffect(() => {
    if (_hasHydrated) {
      if (!userStats.isOnboarded) {
        setShowOnboarding(true);
      }

      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [_hasHydrated, userStats.isOnboarded]);

  // U-04: Apply OLED class to <html> based on theme setting
  useEffect(() => {
    const html = document.documentElement;
    if (userStats.theme === 'oled') {
      html.classList.add('oled');
    } else {
      html.classList.remove('oled');
    }
  }, [userStats.theme]);

  // U-03: Cmd+K / Ctrl+K opens global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // E-01: Workout Reminders polling (every minute)
  useEffect(() => {
    if (!_hasHydrated) return;
    const interval = setInterval(checkAndTriggerReminders, 60000);
    // Also check immediately on load
    checkAndTriggerReminders();
    return () => clearInterval(interval);
  }, [_hasHydrated]);

  // PWA manifest shortcuts: /?action=start-workout, /?view=history|plans|photos
  useEffect(() => {
    if (!_hasHydrated) return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const requestedView = params.get('view');
    let handled = false;

    if (action === 'start-workout' && !activeSession) {
      startSession();
      handled = true;
    }

    if (requestedView && ['dashboard', 'plans', 'photos', 'history', 'library', 'analytics'].includes(requestedView)) {
      setView(requestedView as View);
      handled = true;
    }

    if (handled) {
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      url.searchParams.delete('view');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated]);

  const handleStartRoutine = (routineId: string) => {
    startSession(routineId);
  };

  const handleFinishWithData = (data: FinishData) => {
    setFinishData(data);
  };

  const handleSummaryDismiss = () => {
    setFinishData(null);
    setView('history');
  };

  const handleSummaryContinue = () => {
    setFinishData(null);
    setView('photos');
  };

  // ORGANIC TRANSITIONS
  // "Slide & Scale" effect similar to iOS navigation
  const tabVariants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '10%' : '-10%', // Reduced distance for faster feel
      opacity: 0,
      scale: 0.98,
      zIndex: 1
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      zIndex: 2, // Ensure active is on top
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '10%' : '-10%',
      opacity: 0,
      scale: 0.98,
      zIndex: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <>
      {/* 1. Splash Screen Layer */}
      <AnimatePresence mode="wait">
        {(!_hasHydrated || showSplash) && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "linear" }} // Slightly slower exit for smoothness
            className="fixed inset-0 z-toast"
          >
            <SplashScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Onboarding Layer */}
      <AnimatePresence>
        {showOnboarding && (
          <WelcomeModal onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      <Notifications />

      {/* 3. Global Modals (Settings overlay) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            key="settings-overlay"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, bounce: 0 }}
            className="fixed inset-0 z-modal flex justify-center pointer-events-none"
          >
            <div className="w-full max-w-lg md:max-w-2xl h-full bg-zinc-950 pointer-events-auto shadow-2xl relative overflow-hidden flex flex-col">
              <div className="absolute top-3 right-3 z-10">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  aria-label="Close Settings"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all backdrop-blur-sm border border-zinc-800/50"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
              <Suspense fallback={<LazyFallback />}>
                <Settings />
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Main App Layer */}
      {_hasHydrated && (
        <motion.div
          className="w-full h-full bg-black relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Layout activeTab={view} onTabChange={setView}>

            {/* 
                   mode="popLayout" allows the exiting component to pop out of the flow,
                   letting the new component render immediately on top/behind.
                   This creates the fluid "overlap" feel.
                */}
            <AnimatePresence mode="popLayout" custom={direction}>

              {/* A. FULL SCREEN MODAL (WORKOUT PLAYER) */}
              {activeSession && !isMinimized ? (
                <motion.div
                  key="player"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{
                    type: 'spring',
                    damping: 25,
                    stiffness: 200,
                    mass: 0.8 // Lighter feel
                  }}
                  className="fixed inset-0 z-50 flex justify-center pointer-events-none"
                  style={{ willChange: 'transform' }}
                >
                  <div className="w-full max-w-lg md:max-w-2xl h-full bg-zinc-950 pointer-events-auto shadow-2xl relative overflow-hidden">
                    <WorkoutPlayerBoundary onEscape={() => { setViewTuple(['dashboard', -1]); }}>
                      <Suspense fallback={<LazyFallback />}>
                        <WorkoutPlayer onFinish={() => setView('history')} onFinishWithData={handleFinishWithData} />
                      </Suspense>
                    </WorkoutPlayerBoundary>
                  </div>
                </motion.div>
              ) : (
                /* B. TAB CONTENT (LATERAL NAVIGATION) */
                <motion.div
                  key={view}
                  custom={direction}
                  variants={tabVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="h-full w-full absolute inset-0 overflow-hidden" // Absolute positioning is key for popLayout
                  style={{ willChange: 'transform, opacity' }}
                >
                  {view === 'dashboard' && <Dashboard />}
                  {view === 'plans' && (
                    <Suspense fallback={<PlanSkeleton />}>
                      <PlanManager onStartSession={handleStartRoutine} />
                    </Suspense>
                  )}
                  {view === 'analytics' && (
                    <Suspense fallback={<LazyFallback />}>
                      <AnalyticsDashboard />
                    </Suspense>
                  )}
                  {view === 'library' && (
                    <Suspense fallback={<LazyFallback />}>
                      <ExerciseLibrary />
                    </Suspense>
                  )}
                  {view === 'photos' && (
                    <Suspense fallback={<LazyFallback />}>
                      <ProgressPhotos />
                    </Suspense>
                  )}
                  {view === 'history' && (
                    <HistoryBoundary>
                      <Suspense fallback={<HistorySkeleton />}>
                        <HistoryLog />
                      </Suspense>
                    </HistoryBoundary>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Layout>

          {/* Floating Mini Player */}
          <AnimatePresence>
            {activeSession && isMinimized && <MiniPlayer />}
          </AnimatePresence>

          {/* Post-Workout Photo Prompt */}
          <PostWorkoutPrompt onOpenCamera={() => {
            setFinishData(null);
            setView('photos');
          }} />

          {/* Post-Workout Summary */}
          <AnimatePresence>
            {finishData && (
              <WorkoutSummary
                session={finishData.session}
                muscleGroups={finishData.muscleGroups}
                exercises={finishData.exercises}
                previousSession={finishData.previousSession}
                onContinue={handleSummaryContinue}
                onDismiss={handleSummaryDismiss}
              />
            )}
          </AnimatePresence>

          {/* U-03: Global Search */}
          <AnimatePresence>
            {showGlobalSearch && (
              <GlobalSearch onClose={() => setShowGlobalSearch(false)} />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
};

export default App;