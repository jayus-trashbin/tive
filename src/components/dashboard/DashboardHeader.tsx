import React from 'react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from '../../i18n';
import { AppHeader } from '../ui/AppHeader';

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
        <AppHeader
            actions={
                <button
                    onClick={() => setSettingsOpen(true)}
                    className="group relative shrink-0 tap"
                    aria-label="Open Settings"
                >
                    <div className="w-11 h-11 bg-zinc-800 flex items-center justify-center rounded-full transition-transform active:scale-95 group-hover:bg-zinc-700">
                        <span className="font-bold text-sm text-zinc-300 uppercase">
                            {userStats.name ? userStats.name.substring(0, 2) : 'AT'}
                        </span>
                    </div>
                </button>
            }
        >
            <div className="space-y-0.5">
                <div className="text-caption font-bold text-zinc-500 uppercase tracking-wider">
                    {getGreeting()}
                </div>
                <h1 className="text-h1 font-bold text-white truncate max-w-[220px] capitalize">
                    {userStats.name ? userStats.name.toLowerCase() : 'Athlete'}
                </h1>
            </div>
        </AppHeader>
    );
};
