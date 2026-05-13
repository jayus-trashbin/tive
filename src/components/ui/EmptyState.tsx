import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Button, { ButtonVariant } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonVariant;
    iconLeft?: LucideIcon;
  };
  compact?: boolean;
}

/**
 * EmptyState — standardized empty/zero-data view.
 *
 * Follows impeccable layout law: don't wrap in a card.
 * Icon box uses dashed border to convey "nothing here yet" semantics.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon, title, description, subtitle, action, compact = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-20'}`}
    >
      {/* Icon container */}
      <motion.div 
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={`
          ${compact ? 'w-16 h-16 mb-4' : 'w-20 h-20 mb-5'}
          border border-dashed border-zinc-800
          flex items-center justify-center
          bg-zinc-950/50 rounded-2xl
        `}
      >
        <Icon
          size={compact ? 22 : 28}
          className="text-zinc-600"
          strokeWidth={1.5}
        />
      </motion.div>


      <h3 className="font-bold text-body-lg text-zinc-100 tracking-tight mb-1.5">
        {title}
      </h3>

      {subtitle && (
        <p className="text-label text-brand-primary font-semibold uppercase tracking-wider mb-1.5">
          {subtitle}
        </p>
      )}

      <p className="text-body text-zinc-500 max-w-[260px] leading-relaxed mb-6">
        {description}
      </p>

      {action && (
        <Button
          variant={action.variant ?? 'primary'}
          size="md"
          iconLeft={action.iconLeft}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;
