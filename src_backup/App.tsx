import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useWorkoutStore } from './store/useWorkoutStore';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import WelcomeModal from './components/WelcomeModal';
import ProfileModal from './components/ProfileModal';
import { MiniPlayer } from './components/active-session/MiniPlayer';
import { SplashScreen } from './components/ui/SplashScreen';
import PostWorkoutPrompt from './components/progress/PostWorkoutPrompt';
import { Notifications } from './components/ui/Notifications';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { FinishData } from './components/WorkoutPlayer';
import WorkoutSummary from './components/post-workout/WorkoutSummary';

// Lazy load heavy components for better initial load performance
const WorkoutPlayer = lazy(() => import('./components/WorkoutPlayer'));
const PlanManager = lazy(() => import('./components/PlanManager'));
const HistoryLog = lazy(() => import('./components/HistoryLog'));
const AnalyticsDashboard = lazy(() => import('./components/analytics/AnalyticsDashboard'));
const ProgressPhotos = lazy(() => import('./components/progress/ProgressPhotos'));
const Settings = lazy(() => import('./components/Settings'));

// Simple loading fallback for lazy components
const LazyFallback = () => (
  <div className="flex items-center justify-center h-full bg-black">
    <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

type View = 'dashboard' | 'workout' | 'exercises' | 'plans' | 'history' | 'photos';

// Map views to indices for directional logic
const TAB_ORDER: Record<string, number> = {
  'dashboard': 0,
  'plans': 1,
  'photos': 2,
  'history': 3,
};

const App: React.FC = () => {
  // Use a tuple [currentView, direction] to track navigation direction
  const [[view, direction], setViewTuple] = useState<[View, number]>(['dashboard', 0]);

  const { activeSession, startSession, _hasHydrated, userStats, isMinimized, setHasHydrated, isProfileOpen, setProfileOpen } = useWorkoutStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [finishData, setFinishData] = useState<FinishData | null>(null);

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
        console.warn("Hydration took too long. Forcing app entry.");
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
            className="fixed inset-0 z-[200]"
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

      {/* 3. Global Modals (Profile) */}
      <AnimatePresence>
        {isProfileOpen && (
          <ProfileModal isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
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
          <Layout activeTab={view as any} onTabChange={setView as any}>

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
                    <Suspense fallback={<LazyFallback />}>
                      <WorkoutPlayer onFinish={() => setView('history')} onFinishWithData={handleFinishWithData} />
                    </Suspense>
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
                  <Suspense fallback={<LazyFallback />}>
                    {view === 'dashboard' && <Dashboard />}
                    {view === 'plans' && <PlanManager onStartSession={handleStartRoutine} />}
                    {view === 'photos' && <ProgressPhotos />}
                    {view === 'history' && <HistoryLog />}
                  </Suspense>
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
        </motion.div>
      )}
    </>
  );
};

export default App;