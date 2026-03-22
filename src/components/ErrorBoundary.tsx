
import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Robust Error Boundary to catch UI crashes and provide recovery options.
 * Fixed to correctly extend React.Component with Props and State generics.
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 1. Structured Logging for easy tracing
    console.group('%c [CRITICAL_UI_ERROR]', 'color: #ef4444; font-weight: bold; font-size: 14px;');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
    
    // Fixed: state update now recognized correctly by extending React.Component
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyError = () => {
    const text = `Error: ${this.state.error?.message}\n\nStack: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(text);
    alert('Error details copied to clipboard');
  };

  public render() {
    // Fixed: state and props are now correctly recognized as members of the class component
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-zinc-950 p-6 text-center z-[9999] relative">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          
          <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">System Failure</h1>
          <p className="text-zinc-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            We encountered a critical error. The application state has been preserved safely.
          </p>
          
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button 
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-black font-black rounded-xl active:scale-95 transition-transform shadow-glow"
            >
                <RefreshCw size={18} /> RELOAD APP
            </button>
            
            <button 
                onClick={this.handleCopyError}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 text-zinc-400 font-bold rounded-xl active:scale-95 transition-transform border border-zinc-800"
            >
                <Copy size={18} /> COPY ERROR LOG
            </button>
          </div>

          {/* Dev-only detail view */}
          {(process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') && this.state.error && (
            <div className="mt-8 p-4 bg-black/80 rounded-xl border border-red-900/30 text-left max-w-md w-full overflow-x-auto shadow-inner">
              <p className="text-red-400 font-bold text-xs mb-2 uppercase">Developer Diagnostics:</p>
              <code className="text-[10px] text-red-300/80 font-mono whitespace-pre-wrap break-all">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </code>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
