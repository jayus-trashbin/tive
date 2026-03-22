import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface PRCelebrationProps {
    /** When this changes to a new truthy value, the celebration triggers */
    trigger: string | null;
    exerciseName?: string;
    weight?: number;
    reps?: number;
}

/**
 * Animated PR celebration that appears as a flash overlay
 * when a personal record is detected during workout.
 */
const PRCelebration: React.FC<PRCelebrationProps> = ({
    trigger, exerciseName = '', weight = 0, reps = 0
}) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!trigger) return;
        setVisible(true);

        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
        }

        const timer = setTimeout(() => setVisible(false), 2500);
        return () => clearTimeout(timer);
    }, [trigger]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-[80] pointer-events-none"
                >
                    <div className="relative">
                        {/* Glow ring */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0.8 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            transition={{ duration: 1.2 }}
                            className="absolute inset-0 bg-brand-primary/30 rounded-full blur-xl"
                        />

                        {/* Main card */}
                        <div className="relative bg-zinc-950 border-2 border-brand-primary px-6 py-3 flex items-center gap-3 shadow-[0_0_30px_rgba(163,230,53,0.3)]">
                            <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', delay: 0.1, damping: 12 }}
                            >
                                <Trophy size={22} className="text-brand-primary" />
                            </motion.div>
                            <div>
                                <div className="font-mono text-[10px] font-black text-brand-primary uppercase tracking-widest">
                                    New PR!
                                </div>
                                {exerciseName && (
                                    <div className="font-mono text-xs text-white font-bold">
                                        {exerciseName} — {weight}kg × {reps}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Burst particles */}
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                animate={{
                                    x: Math.cos((i / 8) * Math.PI * 2) * 60,
                                    y: Math.sin((i / 8) * Math.PI * 2) * 40,
                                    scale: 0,
                                    opacity: 0
                                }}
                                transition={{ duration: 0.8, delay: 0.15 }}
                                className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-brand-primary"
                                style={{ marginLeft: -3, marginTop: -3 }}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PRCelebration;
