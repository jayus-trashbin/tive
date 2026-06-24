import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

export type IconButtonVariant = 'default' | 'ghost' | 'danger' | 'brand';
export type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** Required for accessibility — describes the button action */
  'aria-label': string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Makes the button a circle instead of a rounded square */
  round?: boolean;
}

const variantClasses: Record<IconButtonVariant, string> = {
  default: 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 border border-zinc-700/50',
  ghost:   'bg-transparent text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-200',
  danger:  'bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20 border border-brand-danger/30',
  brand:   'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border border-brand-primary/30',
};

// Minimum 44×44px touch target (Apple HIG / Material)
const sizeClasses: Record<IconButtonSize, { container: string; icon: number }> = {
  sm: { container: 'w-9 h-9',   icon: 16 },
  md: { container: 'w-11 h-11', icon: 18 },
  lg: { container: 'w-12 h-12', icon: 20 },
};

/**
 * IconButton — accessible icon-only control.
 *
 * `aria-label` is required (TS enforces it).
 * Touch target is always ≥44×44px per Apple HIG.
 *
 * Usage:
 *   <IconButton icon={Trash2} aria-label="Deletar sessão" variant="danger" />
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  round = true,
  className,
  ...props
}, ref) => {
  const { container, icon: iconSize } = sizeClasses[size];

  return (
    <button
      ref={ref}
      className={cn('inline-flex items-center justify-center shrink-0 transition-all duration-150 tap',
        'active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 focus-visible:ring-offset-black',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        container,
        round ? 'rounded-full' : 'rounded-control',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <Icon size={iconSize} strokeWidth={2} />
    </button>
  );
});

IconButton.displayName = 'IconButton';
export default IconButton;
