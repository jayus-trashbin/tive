import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ─── Store mock ──────────────────────────────────────────────────────────────

const defaultState = {
    activeSession: null,
    isMinimized: false,
    _hasHydrated: true,
    userStats: { isOnboarded: true, name: 'Test User', theme: 'dark' },
    isProfileOpen: false,
    startSession: vi.fn(),
    setHasHydrated: vi.fn(),
    setProfileOpen: vi.fn(),
};

let mockState = { ...defaultState };

vi.mock('../store/useWorkoutStore', () => ({
    useWorkoutStore: (selector: (s: typeof mockState) => unknown) =>
        selector ? selector(mockState) : mockState,
}));

// ─── Component mocks ─────────────────────────────────────────────────────────

vi.mock('../components/WorkoutPlayer', () => ({
    default: () => <div data-testid="workout-player" />,
}));
vi.mock('../components/PlanManager', () => ({
    default: () => <div data-testid="plan-manager" />,
}));
vi.mock('../components/HistoryLog', () => ({
    default: () => <div data-testid="history-log" />,
}));
vi.mock('../components/analytics/AnalyticsDashboard', () => ({
    default: () => <div data-testid="analytics" />,
}));
vi.mock('../components/progress/ProgressPhotos', () => ({
    default: () => <div data-testid="progress-photos" />,
}));
vi.mock('../components/Settings', () => ({
    default: () => <div data-testid="settings" />,
}));
vi.mock('../components/Dashboard', () => ({
    default: () => <div data-testid="dashboard" />,
}));
vi.mock('../components/Layout', () => ({
    default: ({ children }: { children: React.ReactNode }) =>
        <div data-testid="layout">{children}</div>,
}));
vi.mock('../components/ui/SplashScreen', () => ({
    SplashScreen: () => <div data-testid="splash" />,
}));
vi.mock('../components/WelcomeModal', () => ({
    default: ({ onComplete }: { onComplete: () => void }) =>
        <div data-testid="welcome-modal" onClick={onComplete} />,
}));
vi.mock('../components/ProfileModal', () => ({
    default: () => <div data-testid="profile-modal" />,
}));
vi.mock('../components/active-session/MiniPlayer', () => ({
    MiniPlayer: () => <div data-testid="mini-player" />,
}));
vi.mock('../components/ui/Notifications', () => ({
    Notifications: () => null,
}));
vi.mock('../components/progress/PostWorkoutPrompt', () => ({
    default: () => null,
}));
vi.mock('../components/post-workout/WorkoutSummary', () => ({
    default: () => null,
}));
vi.mock('../utils/logger', () => ({
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, style, ...rest }: React.HTMLAttributes<HTMLDivElement>) =>
            <div className={className} style={style}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import App from '../App';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('App', () => {
    beforeEach(() => {
        mockState = { ...defaultState };
        vi.clearAllMocks();
    });

    it('renders main layout when hydrated and onboarded', () => {
        render(<App />);
        expect(screen.getByTestId('layout')).toBeInTheDocument();
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('does not show WelcomeModal when user is already onboarded', () => {
        render(<App />);
        expect(screen.queryByTestId('welcome-modal')).not.toBeInTheDocument();
    });

    it('shows WelcomeModal when user is not onboarded', () => {
        mockState = {
            ...defaultState,
            userStats: { ...defaultState.userStats, isOnboarded: false },
        };
        render(<App />);
        expect(screen.getByTestId('welcome-modal')).toBeInTheDocument();
    });
});
