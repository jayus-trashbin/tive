import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap } from 'lucide-react';

interface PRCelebrationProps {
    trigger: string | null;
    exerciseName?: string;
    weight?: number;
    reps?: number;
    estimated1RM?: number;
}

const CONFETTI_COLORS = ['#bef264', '#facc15', '#f472b6', '#60a5fa', '#a78bfa', '#34d399', '#fb923c'];

interface Particle {
    id: number; x: number; y: number; size: number;
    color: string; rotation: number; shape: 'square' | 'circle';
}

function makeParticles(count = 24): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 300,
        y: -(80 + Math.random() * 160),
        size: 4 + Math.floor(Math.random() * 5),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotation: (Math.random() - 0.5) * 720,
        shape: Math.random() > 0.5 ? 'square' : 'circle',
    }));
}

const PRCelebration: React.FC<PRCelebrationProps> = ({
    trigger, exerciseName = '', weight = 0, reps = 0, estimated1RM
}) => {
    const [visible, setVisible] = useState(false);
    const [particles] = useState(() => makeParticles(24));

    const triggerHaptic = useCallback(() => {
        if (!navigator.vibrate) return;
        navigator.vibrate([60, 40, 60, 40, 120]);
    }, []);

    useEffect(() => {
        if (!trigger) return;
        setVisible(true);
        triggerHaptic();
        const timer = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(timer);
    }, [trigger, triggerHaptic]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.75 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 320 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
                >
                    <div className="relative flex flex-col items-center">
                        {particles.map(p => (
                            <motion.div
                                key={p.id}
                                initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                                animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotation, scale: 0 }}
                                transition={{ duration: 0.9, delay: 0.05, ease: 'easeOut' }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    width: p.size,
                                    height: p.size,
                                    borderRadius: p.shape === 'circle' ? '50%' : '1px',
                                    backgroundColor: p.color,
                                }}
                            />
                        ))}
                        <motion.div
                            initial={{ scale: 0.3, opacity: 0.9 }}
                            animate={{ scale: 3.5, opacity: 0 }}
                            transition={{ duration: 1.0 }}
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{ background: 'radial-gradient(circle, rgba(190,242,100,0.3) 0%, transparent 70%)' }}
                        />
                        <div className="relative bg-zinc-950 border-2 border-brand-primary px-5 py-3 flex items-center gap-3 shadow-[0_0_40px_rgba(190,242,100,0.4)]">
                            <motion.div
                                initial={{ rotate: -25, scale: 0 }}
                                animate={{ rotate: [-25, 15, -8, 5, 0], scale: 1 }}
                                transition={{ type: 'spring', delay: 0.08, damping: 10, stiffness: 250 }}
                            >
                                <Trophy size={24} className="text-brand-primary" />
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Zap size={8} className="text-brand-primary" />
                                    <span className="font-mono text-[9px] font-black text-brand-primary uppercase tracking-[0.2em]">
                                        New PR!
                                    </span>
                                </div>
                                {exerciseName && (
                                    <div className="font-mono text-sm text-white font-bold leading-tight">
                                        {weight}kg x {reps}
                                    </div>
                                )}
                                {exerciseName && (
                                    <div className="font-mono text-[9px] text-zinc-400 truncate max-w-[160px]">
                                        {exerciseName}
                                        {estimated1RM && (
                                            <span className="text-zinc-600"> e1RM {Math.round(estimated1RM)}kg</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <motion.div
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 3, ease: 'linear' }}
                            className="h-[2px] bg-brand-primary/50 mt-1 self-start"
                            style={{ minWidth: '100%' }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PRCelebration;