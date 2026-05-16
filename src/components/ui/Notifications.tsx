import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../i18n';

type NotificationType = 'info' | 'success' | 'error';

const TOAST_CONFIG: Record<NotificationType, {
  icon: typeof Info;
  iconClass: string;
  borderClass: string;
}> = {
  info: {
    icon: Info,
    iconClass: 'text-brand-primary',
    borderClass: 'border-brand-primary/30',
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-brand-success',
    borderClass: 'border-brand-success/30',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-brand-danger',
    borderClass: 'border-brand-danger/40',
  },
};

/**
 * Toast / Notification system.
 *
 * Driven by `useUIStore.addNotification()`.
 * Uses aria-live="polite" for screen reader announcements.
 * Positioned above the bottom nav, inside safe area.
 */
export const Notifications: React.FC = () => {
  const notifications = useUIStore(s => s.notifications);
  const removeNotification = useUIStore(s => s.removeNotification);
  const { t } = useTranslation();

  const labelFor = (type: NotificationType) =>
    type === 'success' ? t('notifications.success')
      : type === 'error' ? t('notifications.error')
      : t('notifications.info');

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={t('notifications.region')}
      className="fixed bottom-24 right-4 z-toast flex flex-col gap-2 w-72 sm:w-80 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {notifications.map(n => {
          const config = TOAST_CONFIG[n.type as NotificationType] ?? TOAST_CONFIG.info;
          const Icon = config.icon;

          return (
            <motion.div
              key={n.id}
              layout
              initial={{ x: 64, opacity: 0, scale: 0.92 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 32, opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 px-3.5 py-3',
                'rounded-xl border bg-zinc-950/95 backdrop-blur-md shadow-2xl',
                config.borderClass,
              )}
            >
              {/* Icon */}
              <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', config.iconClass)} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-caption-xs font-bold text-zinc-500 uppercase tracking-widest mb-0.5">
                  {labelFor(n.type)}
                </p>
                <p className="text-body text-zinc-100 leading-snug">
                  {n.message}
                </p>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => removeNotification(n.id)}
                aria-label={t('notifications.dismiss')}
                className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0 mt-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
