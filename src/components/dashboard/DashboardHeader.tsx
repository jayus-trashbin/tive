import React from 'react';
import { useWorkoutStore } from '../../store/useWorkoutStore';

export const DashboardHeader: React.FC = () => {
    const userStats = useWorkoutStore(s => s.userStats);
    const setProfileOpen = useWorkoutStore(s => s.setProfileOpen);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 6) return "Night Owl Mode";
        if (hour < 12) return "Rise & Grind";
        if (hour < 17) return "Afternoon Push";
        if (hour < 21) return "Evening Session";
        return "Late Night Gains";
    };

    return (
        <header className="flex justify-between items-start shrink-0">
            <div className="space-y-1">
                <div className="section-title">
                    {getGreeting()}
                </div>
                <h1 className="page-title truncate max-w-[220px]">
                    {userStats.name || 'Athlete'}
                </h1>
            </div>

            <button
                onClick={() => setProfileOpen(true)}
                className="group relative shrink-0"
            >
                <div className="w-11 h-11 bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all group-active:translate-y-[1px] group-hover:border-brand-primary rounded-[4px]">
                    <span className="font-heading font-bold text-sm text-brand-primary uppercase">
                        {userStats.name ? userStats.name.substring(0, 2) : 'AT'}
                    </span>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-primary shadow-glow rounded-full" />
            </button>
        </header>
    );
};
