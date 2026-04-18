import React from 'react';
import SkeletonBlock from '../SkeletonBlock';

const DashboardSkeleton: React.FC = () => (
    <div className="flex flex-col h-full px-4 pt-safe pb-32 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="space-y-2 pt-4">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-7 w-40" />
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 space-y-2">
                    <SkeletonBlock className="h-3 w-10" />
                    <SkeletonBlock className="h-6 w-14" />
                </div>
            ))}
        </div>

        {/* Chart stub */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 space-y-3">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-32 w-full" />
        </div>

        {/* Secondary cards row */}
        <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 space-y-2">
                    <SkeletonBlock className="h-3 w-16" />
                    <SkeletonBlock className="h-5 w-20" />
                    <SkeletonBlock className="h-3 w-12" />
                </div>
            ))}
        </div>
    </div>
);

export default DashboardSkeleton;
