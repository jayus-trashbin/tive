import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';

export const AutoRegulationBanner: React.FC = () => {
  const { activeSession } = useWorkoutStore();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!activeSession || activeSession.sets.length === 0) return;

    // Check last completed set
    const lastSet = activeSession.sets[activeSession.sets.length - 1];
    if (lastSet && lastSet.isCompleted && lastSet.rpe && lastSet.rpe >= 9.5) {
      setMessage('Carga alta detectada! Risco de falha técnica no próximo set. Considere reduzir 5% do peso.');
      setShow(true);
      
      const timer = setTimeout(() => {
        setShow(false);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [activeSession]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="mx-4 mt-4 mb-2 bg-brand-danger/10 border border-brand-danger/20 rounded-xl p-3 flex items-start gap-3 shadow-lg"
        >
          <div className="p-1.5 bg-brand-danger/20 rounded-lg shrink-0">
            <AlertTriangle className="text-brand-danger" size={18} />
          </div>
          <div className="flex-1 pt-0.5">
            <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              Auto-Regulação
              <TrendingDown size={14} className="text-brand-danger" />
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AutoRegulationBanner;
