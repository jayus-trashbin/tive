import React from 'react';
import { Search, Calendar as CalendarIcon, List, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HistoryHeaderProps {
    viewMode: 'journal' | 'analytics';
    setViewMode: (mode: 'journal' | 'analytics') => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onShowCalendar: () => void;
}

export const HistoryHeader: React.FC<HistoryHeaderProps> = ({
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    onShowCalendar
}) => {
    return (
        <header
            className="shrink-0 px-5 pb-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-30"
            style={{ paddingTop: `calc(var(--sat) + 1.25rem)` }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <div className="section-title">Your Workouts</div>
                    <h1 className="page-title">
                        History<span className="text-brand-primary">_</span>
                    </h1>
                </div>

                {/* View Toggle */}
                <div className="flex p-0.5 bg-zinc-900 border border-zinc-800 rounded-[4px]">
                    <button
                        onClick={() => setViewMode('journal')}
                        className={cn(
                            "p-3 rounded-[2px] transition-all",
                            viewMode === 'journal' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <List size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('analytics')}
                        className={cn(
                            "p-3 rounded-[2px] transition-all",
                            viewMode === 'analytics' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <BarChart3 size={20} />
                    </button>
                </div>
            </div>

            {/* Search / Calendar (Journal Only) */}
            {viewMode === 'journal' && (
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search sessions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-brand-primary text-sm text-zinc-200 font-mono placeholder:text-zinc-600 rounded-[4px] outline-none transition-colors"
                        />
                    </div>
                    <button
                        onClick={onShowCalendar}
                        className="px-3 bg-zinc-900 border border-zinc-800 hover:border-brand-primary/50 text-zinc-400 hover:text-brand-primary transition-colors rounded-[4px]"
                    >
                        <CalendarIcon size={18} />
                    </button>
                </div>
            )}
        </header>
    );
};
