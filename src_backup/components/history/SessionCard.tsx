import React from 'react';
import { Timer, ChevronRight, TrendingUp, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Session, WorkoutSet } from '../../types';

interface SessionCardProps {
    session: Session;
    onClick: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onClick }) => {
    const completedSets = session.sets.filter(s => s.isCompleted);
    const completedCount = completedSets.length;
    const isBestSet = session.sets.some(s => s.isPR);

    const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff}d ago`;
        return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    const formatDuration = () => {
        if (completedCount === 0) return '—';
        const lastTimestamp = Math.max(...completedSets.map(s => s.timestamp));
        const diff = Math.floor((lastTimestamp - session.date) / 60000);
        return `${diff}m`;
    };

    const getTotalVolume = (sets: WorkoutSet[]) => {
        const vol = sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
        if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
        return vol.toString();
    };

    const getAccentColor = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('push') || lower.includes('chest') || lower.includes('peito')) return 'bg-red-500';
        if (lower.includes('pull') || lower.includes('back') || lower.includes('costas')) return 'bg-blue-500';
        if (lower.includes('leg') || lower.includes('perna')) return 'bg-green-500';
        if (lower.includes('upper') || lower.includes('superior')) return 'bg-purple-500';
        if (lower.includes('full') || lower.includes('total')) return 'bg-brand-primary';
        return 'bg-zinc-600';
    };

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
            }}
            onClick={onClick}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 active:scale-[0.98] transition-all cursor-pointer hover:border-zinc-700"
        >
            <div className="w-full text-left p-0 overflow-hidden flex group cursor-pointer">
                <div className={cn("w-1 shrink-0", getAccentColor(session.name))} />
                <div className="flex-1 px-4 py-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-heading font-bold text-white uppercase tracking-tight truncate group-hover:text-brand-primary transition-colors flex items-center gap-2">
                            {session.name}
                            {isBestSet && <Trophy size={12} className="text-yellow-500 fill-yellow-500/20" />}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="data-label text-zinc-500">{formatDate(session.date)}</span>
                            <span className="data-label text-zinc-600">•</span>
                            <span className="data-label text-zinc-500 flex items-center gap-1">
                                <Timer size={10} />{formatDuration()}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                            <div className="text-sm font-heading font-bold text-white">{completedCount}</div>
                            <div className="data-label">Sets</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-heading font-bold text-brand-primary flex items-center gap-1 justify-end">
                                <TrendingUp size={10} />{getTotalVolume(completedSets)}
                            </div>
                            <div className="data-label">Vol</div>
                        </div>
                        <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
