import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cn } from '../../lib/utils';
import IconButton from './IconButton';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    showCloseButton?: boolean;
    position?: 'center' | 'bottom';
}

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } }
};

const getModalVariants = (position: 'center' | 'bottom') => {
    if (position === 'bottom') {
        return {
            hidden: { opacity: 0, y: "100%" },
            visible: { 
                opacity: 1, 
                y: 0, 
                transition: { type: 'spring', damping: 25, stiffness: 300 }
            },
            exit: { 
                opacity: 0, 
                y: "100%", 
                transition: { duration: 0.15 }
            }
        };
    }
    return {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { type: 'spring', damping: 25, stiffness: 300 }
        },
        exit: { 
            opacity: 0, 
            y: 10, 
            scale: 0.95,
            transition: { duration: 0.15 }
        }
    };
};

import { useBackDismiss } from '../../hooks/useBackDismiss';

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    className,
    showCloseButton = true,
    position = 'center'
}) => {
    const focusRef = useFocusTrap<HTMLDivElement>(isOpen);
    useBackDismiss(isOpen, onClose);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={cn(
                    "fixed inset-0 z-modal flex px-4 pt-safe pb-safe",
                    position === 'bottom' ? "items-end sm:items-center justify-center" : "items-center justify-center"
                )}>
                    {/* Backdrop */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* Modal Content */}
                    <motion.div
                        ref={focusRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? "modal-title" : undefined}
                        variants={getModalVariants(position)}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={cn(
                            "relative w-full max-w-md bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
                            position === 'bottom' ? "rounded-t-3xl sm:rounded-2xl" : "rounded-2xl",
                            className
                        )}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 shrink-0">
                                {title && (
                                    <h2 id="modal-title" className="text-lg font-bold text-white">
                                        {title}
                                    </h2>
                                )}
                                {showCloseButton && (
                                    <IconButton
                                        icon={X}
                                        aria-label="Close modal"
                                        onClick={onClose}
                                        className={cn("ml-auto", !title && "absolute right-2 top-2")}
                                    />
                                )}
                            </div>
                        )}

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-4">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
