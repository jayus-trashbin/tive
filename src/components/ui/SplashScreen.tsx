import React from 'react';
import { motion } from 'framer-motion';

/**
 * Splash Screen
 * 
 * Features:
 * - Minimal, elegant loading state
 * - Pure black background
 */
export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative mb-8"
        >
          <h1 className="text-5xl font-bold text-white tracking-widest uppercase leading-none">
            TIVE
          </h1>
        </motion.div>

        {/* Simple Progress Line */}
        <div className="w-32 h-[2px] bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-primary"
            initial={{ width: "0%", x: "-100%" }}
            animate={{ width: ["0%", "50%", "100%"], x: ["-100%", "0%", "100%"] }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        </div>
      </div>
    </div>
  );
};
