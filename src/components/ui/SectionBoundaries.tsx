
import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, BarChart2, AlertTriangle } from 'lucide-react';
import { logger } from '../../utils/logger';

interface Props {
    children: ReactNode;
}
interface State {
    hasError: boolean;
}

/**
 * Scoped boundary for the Analytics Dashboard.
 * Shows an inline error panel instead of crashing the whole app.
 */
export class AnalyticsBoundary extends React.Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        logger.error('AnalyticsBoundary', error.message, { stack: error.stack, componentStack: info.componentStack });
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                    <BarChart2 size={22} />
                </div>
                <div>
                    <p className="text-sm font-bold text-zinc-300">Analytics unavailable</p>
                    <p className="text-xs text-zinc-600 mt-1">An error occurred while loading your stats.</p>
                </div>
                <button
                    onClick={() => this.setState({ hasError: false })}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 active:scale-95 transition-all"
                >
                    <RefreshCw size={12} /> Retry
                </button>
            </div>
        );
    }
}

/**
 * Scoped boundary for the History section.
 * Shows an inline reload prompt instead of a full-screen crash.
 */
export class HistoryBoundary extends React.Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        logger.error('HistoryBoundary', error.message, { stack: error.stack, componentStack: info.componentStack });
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                    <AlertTriangle size={20} />
                </div>
                <div>
                    <p className="text-sm font-bold text-zinc-300">History failed to load</p>
                    <p className="text-xs text-zinc-600 mt-1">Your data is safe. Try refreshing.</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 active:scale-95 transition-all"
                >
                    <RefreshCw size={12} /> Reload app
                </button>
            </div>
        );
    }
}

/**
 * Scoped boundary for the WorkoutPlayer.
 * Provides a "Recovery mode" fallback so the user can exit the crashed session.
 */
interface PlayerBoundaryProps extends Props {
    onEscape: () => void;
}

interface PlayerState {
    hasError: boolean;
}

export class WorkoutPlayerBoundary extends React.Component<PlayerBoundaryProps, PlayerState> {
    state: PlayerState = { hasError: false };

    static getDerivedStateFromError(): PlayerState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        logger.error('WorkoutPlayerBoundary', error.message, { stack: error.stack, componentStack: info.componentStack });
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 gap-6 text-center px-8">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                    <AlertTriangle size={26} />
                </div>
                <div>
                    <p className="text-lg font-bold text-white tracking-tight">Session Crashed</p>
                    <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                        The workout player encountered an error. Your sets have been auto-saved.
                    </p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="w-full py-4 bg-white text-black font-bold text-sm rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={16} /> Resume Session
                    </button>
                    <button
                        onClick={this.props.onEscape}
                        className="w-full py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-sm rounded-xl active:scale-95 transition-transform"
                    >
                        Exit to Dashboard
                    </button>
                </div>
            </div>
        );
    }
}
