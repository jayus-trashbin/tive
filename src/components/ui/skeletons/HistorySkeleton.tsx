import React from 'react';
import SkeletonBlock from '../SkeletonBlock';

const HistorySkeleton: React.FC = () => (
    <div className="flex flex-col h-full px-4 pt-safe pb-32 space-y-4 overflow-hidden">
        {/* Header */}
        <div className="space-y-2 pt-4">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-7 w-32" />
        </div>

        {/* Search bar */}
        <SkeletonBlock className="h-10 w-full rounded-md" />

        {/* Session cards */}
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                        <SkeletonBlock className="h-4 w-36" />
                        <SkeletonBlock className="h-3 w-24" />
                    </div>
                    <SkeletonBlock className="h-5 w-14" />
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map(j => (
                        <SkeletonBlock key={j} className="h-5 w-16 rounded-full" />
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export default HistorySkeleton;
