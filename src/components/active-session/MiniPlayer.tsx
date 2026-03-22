import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { Maximize2, Timer, Dumbbell, Pause, Play } from 'lucide-react';
import { cn } from '../../lib/utils';

export const MiniPlayer = () => {
    const { activeSession, toggleMinimize, restTimer } = useWorkoutStore();
    const [duration, setDuration] = useState('0:00');
    const [restRemaining, setRestRemaining] = useState(0);

    // Duration Timer
    useEffect(() => {
        if(!activeSession) return;
        const interval = setInterval(() => {
            const diff = Math.floor((Date.now() - activeSession.date) / 1000);
            const m = Math.floor(diff / 60);
            const s = diff % 60;
            setDuration(`${m}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [activeSession]);

    // Rest Timer Logic
    useEffect(() => {
        if (!restTimer.endTime) {
            setRestRemaining(0);
            return;
        }
        const interval = setInterval(() => {
            const now = Date.now();
            const left = Math.ceil((restTimer.endTime! - now) / 1000);
            if (left <= 0) setRestRemaining(0);
            else setRestRemaining(left);
        }, 500);
        return () => clearInterval(interval);
    }, [restTimer.endTime]);

    if (!activeSession) return null;

    const isResting = restRemaining > 0;
    
    // Calculate progress for rest timer background
    const restProgress = isResting && restTimer.originalDuration > 0
        ? (restRemaining / restTimer.originalDuration) * 100
        : 0;

    return (
        <motion.div 
            initial={{ y: 150, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 150, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-[90px] left-4 right-4 z-40 flex justify-center pointer-events-none"
        >
            <div 
                onClick={() => toggleMinimize(false)}
                className="w-full max-w-lg md:max-w-2xl pointer-events-auto cursor-pointer group"
            >
                {/* Main Card */}
                <div className="relative overflow-hidden bg-black/80 backdrop-blur-xl border border-white/10 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 flex items-center justify-between">
                    
                    {/* Rest Timer Progress Background (Subtle) */}
                    {isResting && (
                        <motion.div 
                            className="absolute bottom-0 left-0 h-[2px] bg-brand-primary z-20"
                            initial={{ width: "100%" }}
                            animate={{ width: `${restProgress}%` }}
                            transition={{ ease: "linear", duration: 0.5 }}
                        />
                    )}

                    <div className="flex items-center gap-4">
                        {/* Status Icon */}
                        <div className={cn(
                            "relative w-12 h-12 rounded-full flex items-center justify-center border transition-colors",
                            isResting 
                                ? "bg-brand-primary/10 border-brand-primary text-brand-primary" 
                                : "bg-white/5 border-white/10 text-white"
                        )}>
                            {isResting ? (
                                <>
                                    <div className="absolute inset-0 rounded-full border border-brand-primary opacity-50 animate-ping" />
                                    <Timer size={20} className="relative z-10" />
                                </>
                            ) : (
                                <Dumbbell size={20} className="relative z-10" />
                            )}
                        </div>

                        {/* Text Info */}
                        <div className="flex flex-col">
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider mb-0.5",
                                isResting ? "text-brand-primary" : "text-zinc-400"
                            )}>
                                {isResting ? "Resting" : "Active Session"}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-mono font-bold text-white leading-none tracking-tight">
                                    {isResting 
                                        ? `${Math.floor(restRemaining / 60)}:${String(restRemaining % 60).padStart(2, '0')}` 
                                        : duration
                                    }
                                </span>
                                {isResting && (
                                    <span className="text-[10px] text-zinc-500 font-medium">remaining</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pl-4 border-l border-white/10">
                        <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 transition-colors group-active:scale-95">
                            <Maximize2 size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};