import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    compact?: boolean;
}

/**
 * EmptyState
 * A premium, standardized empty state component with tech-brutalist styling.
 */
const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, compact = false }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center justify-center text-center ${compact ? 'py-12' : 'py-24'}`}
        >
            <div className={`
                ${compact ? 'w-16 h-16' : 'w-24 h-24'} 
                border border-dashed border-zinc-800 
                flex items-center justify-center mb-6 
                bg-zinc-950/50 rounded-[4px]
                shadow-[0px_0px_15px_-3px_rgba(0,0,0,0.5)]
            `}>
                <Icon
                    size={compact ? 24 : 32}
                    className="text-zinc-700"
                    strokeWidth={1.5}
                />
            </div>

            <h3 className="font-heading font-bold text-lg text-white uppercase tracking-tight mb-2">
                {title}
            </h3>

            <p className="data-label text-zinc-500 max-w-[240px] leading-relaxed mb-6">
                {description}
            </p>

            {action && (
                <button
                    onClick={action.onClick}
                    className="btn-tech text-[10px] px-6 py-3"
                >
                    {action.label}
                </button>
            )}
        </motion.div>
    );
};

export default EmptyState;
