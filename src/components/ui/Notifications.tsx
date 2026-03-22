import React from 'react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, AlertCircle, CheckCircle, X } from 'lucide-react';

export const Notifications: React.FC = () => {
    const notifications = useWorkoutStore(s => s.notifications);
    const removeNotification = useWorkoutStore(s => s.removeNotification);

    return (
        <div className="fixed top-20 right-4 z-[300] flex flex-col gap-2 w-72 md:w-80 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        layout
                        initial={{ x: 50, opacity: 0, scale: 0.9 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: 20, opacity: 0, scale: 0.9 }}
                        className={`pointer-events-auto flex items-start gap-3 p-3 border-2 bg-black/90 backdrop-blur-md shadow-[4px_4px_0px_0px] ${n.type === 'error' ? 'border-red-500/50 shadow-red-950/40' :
                            n.type === 'success' ? 'border-emerald-500/50 shadow-emerald-950/40' :
                                'border-zinc-700/50 shadow-zinc-950/40'
                            }`}
                    >
                        <div className="mt-0.5 shrink-0">
                            {n.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                            {n.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                            {n.type === 'info' && <Info className="w-5 h-5 text-brand-primary" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest leading-none mb-1 opacity-50">
                                {n.type}
                            </p>
                            <p className="text-sm font-medium text-zinc-200 leading-tight">
                                {n.message}
                            </p>
                        </div>
                        <button
                            onClick={() => removeNotification(n.id)}
                            className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
