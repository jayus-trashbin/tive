import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BOOT_MESSAGES = [
  'Initializing core…',
  'Loading protocols…',
  'Syncing physiology…',
  'Ready.',
];

/**
 * Splash Screen — Tech Boot Sequence
 * 
 * Features:
 * - Barlow Condensed "TIVE" logo with glitch flash
 * - Cycling boot status messages
 * - Segmented progress bar (10 blocks)
 * - Pure black + lime accent palette
 * - Grid background matching the app aesthetic
 */
export const SplashScreen: React.FC = () => {
  const [bootIndex, setBootIndex] = useState(0);
  const [filledBlocks, setFilledBlocks] = useState(0);

  // Cycle boot messages
  useEffect(() => {
    const interval = setInterval(() => {
      setBootIndex(prev => {
        if (prev >= BOOT_MESSAGES.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, []);

  // Animate progress blocks
  useEffect(() => {
    const interval = setInterval(() => {
      setFilledBlocks(prev => {
        if (prev >= 10) {
          clearInterval(interval);
          return 10;
        }
        return prev + 1;
      });
    }, 220);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative"
        >
          <h1 className="text-7xl font-heading font-black text-white tracking-[0.15em] uppercase leading-none">
            TIVE
          </h1>

          {/* Glitch line flash */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: [0, 1, 1, 0] }}
            transition={{ duration: 1.2, delay: 0.3, times: [0, 0.2, 0.8, 1] }}
            className="absolute top-1/2 -left-4 -right-4 h-[2px] bg-brand-primary origin-left"
          />
        </motion.div>

        {/* Version Tag */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.6 }}
          className="mt-3 font-mono text-[9px] text-zinc-600 tracking-[0.4em] uppercase"
        >
          Adaptive Training v2.1
        </motion.div>
      </div>

      {/* Bottom Section: Progress + Status */}
      <div className="absolute bottom-20 left-0 right-0 px-12 space-y-4">
        {/* Segmented Progress Bar */}
        <div className="flex gap-1">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.15 }}
              animate={{
                opacity: i < filledBlocks ? 1 : 0.15,
                backgroundColor: i < filledBlocks ? '#bef264' : '#27272a',
              }}
              transition={{ duration: 0.15 }}
              className="flex-1 h-[4px]"
            />
          ))}
        </div>

        {/* Boot Status */}
        <AnimatePresence mode="wait">
          <motion.p
            key={bootIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 0.5, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.3em] text-center"
          >
            {BOOT_MESSAGES[bootIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};
