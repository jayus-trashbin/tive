import React, { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StreakCardProps {
    streak: number;
    history: any[];
}

export const StreakCard: React.FC<StreakCardProps> = ({ streak, history }) => {
    const last7Days = useMemo(() => {
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const timestamp = d.getTime();

            const hasSession = history.some(s => {
                const sDate = new Date(s.date).setHours(0, 0, 0, 0);
                return sDate === timestamp;
            });

            days.push({ day: d.toLocaleDateString('en-US', { weekday: 'narrow' }), active: hasSession });
        }
        return days;
    }, [history]);

    return (
        <div className="card flex flex-col justify-between p-4 min-w-[160px] relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
                <div>
                    <div className="text-3xl font-bold text-white leading-none tracking-tight flex items-center gap-2">
                        {streak} <Flame size={20} className={streak > 0 ? "text-orange-500 fill-orange-500" : "text-zinc-700"} />
                    </div>
                    <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mt-1">Day Streak</div>
                </div>
            </div>

            <div className="flex justify-between gap-1 mt-4 z-10">
                {last7Days.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                        <div className={cn(
                            "w-full h-8 rounded-full transition-colors max-w-[8px]",
                            d.active ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" : "bg-zinc-800"
                        )} />
                        <span className="text-[10px] font-medium text-zinc-500">{d.day}</span>
                    </div>
                ))}
            </div>

            {/* Background Effect */}
            <div className="absolute -bottom-4 -right-4 text-zinc-800/20 rotate-[-15deg] group-hover:text-orange-500/10 transition-colors duration-500 pointer-events-none">
                <Flame size={80} />
            </div>
        </div>
    );
};
