import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-brand-primary text-black hover:bg-brand-primaryHover active:bg-brand-primaryHover font-semibold shadow-sm',
  secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/60 active:bg-zinc-700 font-medium',
  ghost:     'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 active:bg-zinc-800 font-medium',
  danger:    'bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20 border border-brand-danger/30 active:bg-brand-danger/25 font-semibold',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8  px-3 text-label gap-1.5 rounded-control',
  md: 'h-11 px-4 text-body gap-2  rounded-control',
  lg: 'h-12 px-5 text-body-lg gap-2 rounded-xl',
};

const iconSizes: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

/**
 * Button — primary interactive element.
 *
 * Usage:
 *   <Button variant="primary" size="md" loading={isSubmitting}>Save</Button>
 *   <Button variant="danger" iconLeft={Trash2}>Delete</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  iconLeft: IconLeft,
  iconRight: IconRight,
  fullWidth = false,
  className,
  children,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;
  const iconSize = iconSizes[size];

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        // Base
        'inline-flex items-center justify-center transition-all duration-150',
        'active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        // Variant + size
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin shrink-0" />
      ) : IconLeft ? (
        <IconLeft size={iconSize} className="shrink-0" />
      ) : null}

      {children && (
        <span className={loading ? 'opacity-70' : undefined}>{children}</span>
      )}

      {!loading && IconRight && (
        <IconRight size={iconSize} className="shrink-0 ml-auto" />
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
