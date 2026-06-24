import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Share2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import WeeklyChallenge from './WeeklyChallenge';
import WilksLeaderboard from './WilksLeaderboard';
import PRShareCard from './PRShareCard';

type SocialTab = 'challenge' | 'leaderboard' | 'share';

const TABS: { id: SocialTab; label: string; icon: React.ReactNode }[] = [
    { id: 'challenge', label: 'Challenge', icon: <Flame size={12} /> },
    { id: 'leaderboard', label: 'Ranking', icon: <Trophy size={12} /> },
    { id: 'share', label: 'Share', icon: <Share2 size={12} /> },
];

const SocialHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SocialTab>('challenge');

    return (
        <div className="space-y-4">
            {/* Section label */}
            <div className="flex items-center gap-2">
                <div className="section-title">Community</div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-caption-xs font-bold uppercase tracking-wider transition-all',
                            activeTab === tab.id
                                ? 'bg-zinc-800 text-white'
                                : 'text-zinc-600 hover:text-zinc-400'
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                >
                    {activeTab === 'challenge' && <WeeklyChallenge />}
                    {activeTab === 'leaderboard' && <WilksLeaderboard />}
                    {activeTab === 'share' && <PRShareCard />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default SocialHub;
