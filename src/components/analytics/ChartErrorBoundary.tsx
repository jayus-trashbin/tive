import React from 'react';

interface State {
    hasError: boolean;
}

class ChartErrorBoundary extends React.Component<React.PropsWithChildren, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center h-full min-h-[120px] bg-zinc-900/50 border border-zinc-800 rounded-[4px]">
                    <p className="text-xs font-mono text-zinc-600">Chart unavailable</p>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ChartErrorBoundary;
