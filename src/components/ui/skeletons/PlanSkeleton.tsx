import React from 'react';
import SkeletonBlock from '../SkeletonBlock';

const PlanSkeleton: React.FC = () => (
    <div className="flex flex-col h-full px-4 pt-safe pb-32 space-y-4 overflow-hidden">
        {/* Header */}
        <div className="space-y-2 pt-4">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-7 w-28" />
        </div>

        {/* New routine button */}
        <SkeletonBlock className="h-12 w-full" />

        {/* Routine cards */}
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                        <SkeletonBlock className="h-4 w-40" />
                        <SkeletonBlock className="h-3 w-28" />
                    </div>
                    <SkeletonBlock className="h-8 w-20" />
                </div>
                <div className="flex gap-2">
                    {[1, 2].map(j => (
                        <SkeletonBlock key={j} className="h-5 w-18 rounded-full" />
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export default PlanSkeleton;
