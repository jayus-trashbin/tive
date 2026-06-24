import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  isOpen: boolean;
  currentRpe: number;
  onSelect: (value: number) => void;
  onClose: () => void;
}

const RpePicker: React.FC<Props> = ({ isOpen, currentRpe, onSelect, onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rpeValues = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

  // Auto-scroll to selected value
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      // Small timeout to allow render
      setTimeout(() => {
        if (!scrollRef.current) return;
        const selectedBtn = scrollRef.current.querySelector('[data-selected="true"]');
        if (selectedBtn) {
            selectedBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 100);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (Invisible hit area to close) */}
          <div 
            onClick={onClose}
            className="fixed inset-0 z-modal bg-black/20 backdrop-blur-[2px]"
          />

          {/* Floating Compact Bar */}
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-safe left-4 right-4 z-overlay mb-4"
          >
            <div className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-2">
                
                {/* Header Row */}
                <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 mb-2">
                    <div className="flex items-center gap-2">
                        <Flame className="text-brand-warning" size={14} />
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">RPE / Intensity</span>
                    </div>
                    <div className="text-caption-xs text-zinc-500 font-medium">
                        {currentRpe >= 9 ? 'FAILURE' : currentRpe >= 7 ? 'HARD' : 'MODERATE'}
                    </div>
                </div>

                {/* Horizontal Scroll List */}
                <div 
                    ref={scrollRef}
                    className="flex overflow-x-auto gap-2 pb-2 px-2 no-scrollbar snap-x"
                >
                    {rpeValues.map((val) => {
                        const isSelected = val === currentRpe;
                        const isHigh = val >= 9;
                        
                        return (
                            <button
                                key={val}
                                data-selected={isSelected}
                                onClick={() => { onSelect(val); onClose(); }}
                                className={cn(
                                    "flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all snap-center border",
                                    isSelected 
                                        ? "bg-brand-primary border-brand-primary text-white shadow-glow transform scale-105" 
                                        : isHigh 
                                            ? "bg-red-400/10 border-red-400/20 text-red-400"
                                            : val >= 7 
                                                ? "bg-amber-300/10 border-amber-300/20 text-amber-300 hover:bg-amber-300/20"
                                                : "bg-emerald-400/10 border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/20"
                                )}
                            >
                                <span className="text-lg font-bold tracking-tighter">{val}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RpePicker;