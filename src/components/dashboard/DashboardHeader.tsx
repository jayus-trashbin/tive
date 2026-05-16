import React from 'react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from '../../i18n';

export const DashboardHeader: React.FC = () => {
    const userStats = useWorkoutStore(s => s.userStats);
    const setSettingsOpen = useUIStore(s => s.setSettingsOpen);
    const { lang } = useTranslation();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (lang === 'pt-BR') {
            if (hour < 12) return 'Bom dia,';
            if (hour < 18) return 'Boa tarde,';
            return 'Boa noite,';
        }
        if (hour < 12) return 'Good morning,';
        if (hour < 18) return 'Good afternoon,';
        return 'Good evening,';
    };

    return (
        <header className="flex justify-between items-center shrink-0">
            <div className="space-y-0.5">
                <div className="text-sm font-medium text-zinc-400">
                    {getGreeting()}
                </div>
                <h1 className="page-title truncate max-w-[220px] capitalize">
                    {userStats.name ? userStats.name.toLowerCase() : 'Athlete'}
                </h1>
            </div>

            <button
                onClick={() => setSettingsOpen(true)}
                className="group relative shrink-0"
                aria-label="Open Settings"
            >
                <div className="w-12 h-12 bg-zinc-800 flex items-center justify-center rounded-full transition-transform active:scale-95 group-hover:bg-zinc-700">
                    <span className="font-bold text-sm text-zinc-300 uppercase">
                        {userStats.name ? userStats.name.substring(0, 2) : 'AT'}
                    </span>
                </div>
            </button>
        </header>
    );
};
