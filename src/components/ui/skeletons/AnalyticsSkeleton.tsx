import React from 'react';
import SkeletonBlock from '../SkeletonBlock';

const AnalyticsSkeleton: React.FC = () => (
    <div className="flex flex-col h-full px-4 pt-safe pb-32 space-y-5 overflow-hidden">
        {/* Header */}
        <div className="space-y-2 pt-4">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-7 w-32" />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
                <SkeletonBlock key={i} className="h-7 w-16 rounded-full" />
            ))}
        </div>

        {/* Primary chart */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 space-y-3">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-40 w-full" />
        </div>

        {/* Secondary chart */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-32 w-full" />
        </div>
    </div>
);

export default AnalyticsSkeleton;
