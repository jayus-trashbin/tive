import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Lightweight confirmation modal. Renders portal-free overlay with backdrop blur.
 * Closes on Escape. Click outside backdrop also cancels.
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <motion.div
            ref={trapRef}
            initial={{ scale: 0.92, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 4, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden'
            )}
          >
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    variant === 'danger' ? 'bg-brand-danger/15' : 'bg-brand-primary/15'
                  )}
                >
                  <AlertTriangle
                    size={20}
                    className={variant === 'danger' ? 'text-brand-danger' : 'text-brand-primary'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 id="confirm-modal-title" className="text-base font-bold text-white mb-1">
                    {title}
                  </h2>
                  {description && (
                    <p className="text-sm text-zinc-400 leading-snug">{description}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex border-t border-zinc-800/80">
              <Button
                variant="ghost"
                fullWidth
                onClick={onCancel}
                className="rounded-none h-12 border-r border-zinc-800/80"
              >
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                fullWidth
                onClick={onConfirm}
                className="rounded-none h-12"
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
