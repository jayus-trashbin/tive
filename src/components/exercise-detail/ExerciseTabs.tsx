import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Props {
    activeTab: 'guide' | 'history' | 'anatomy';
    setActiveTab: (tab: 'guide' | 'history' | 'anatomy') => void;
}

export const ExerciseTabs: React.FC<Props> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="px-6 mt-6 mb-4 sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-30 py-2 -mx-2 px-2 border-b border-white/5">
            <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                {['guide', 'history', 'anatomy'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={cn(
                            "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative z-10",
                            activeTab === tab ? "text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-zinc-800 rounded-lg -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    );
};
