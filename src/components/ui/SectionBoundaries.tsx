
import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, BarChart2, AlertTriangle } from 'lucide-react';
import { logger } from '../../utils/logger';
import Button from './Button';

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
          <p className="text-body font-bold text-zinc-300">Analytics unavailable</p>
          <p className="text-caption text-zinc-600 mt-1">An error occurred while loading your stats.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          iconLeft={RefreshCw}
          onClick={() => this.setState({ hasError: false })}
        >
          Retry
        </Button>
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
          <p className="text-body font-bold text-zinc-300">History failed to load</p>
          <p className="text-caption text-zinc-600 mt-1">Your data is safe. Try refreshing.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          iconLeft={RefreshCw}
          onClick={() => window.location.reload()}
        >
          Reload app
        </Button>
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
      <div className="fixed inset-0 z-debug flex flex-col items-center justify-center bg-zinc-950 gap-6 text-center px-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-danger/10 border border-brand-danger/20 flex items-center justify-center text-brand-danger">
          <AlertTriangle size={26} />
        </div>
        <div>
          <p className="text-h2 text-white tracking-tight">Session Crashed</p>
          <p className="text-body text-zinc-500 mt-2 leading-relaxed">
            The workout player encountered an error. Your sets have been auto-saved.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            iconLeft={RefreshCw}
            onClick={() => this.setState({ hasError: false })}
          >
            Resume Session
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={this.props.onEscape}
          >
            Exit to Dashboard
          </Button>
        </div>
      </div>
    );
  }
}
