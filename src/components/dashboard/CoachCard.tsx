import React from 'react';
import { Brain, Flame, Coffee, Activity, ChevronRight, Sparkles } from 'lucide-react';
import { useNextWorkoutAdvisor } from '../../hooks/useNextWorkoutAdvisor';
import { motion } from 'framer-motion';

interface Props {
  onStartRoutine?: (routineId: string) => void;
}

export const CoachCard: React.FC<Props> = ({ onStartRoutine }) => {
  const advisor = useNextWorkoutAdvisor();

  if (!advisor) return <div className="card mb-6 p-4 text-brand-primary">Advisor returned null! routines length check failed.</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mb-6 relative overflow-hidden group"
    >
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />

      <div className="p-4 flex items-start gap-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20 shadow-[0_0_15px_rgba(190,242,100,0.1)]">
          {advisor.type === 'routine' && <Brain className="text-brand-primary" size={22} />}
          {advisor.type === 'active_recovery' && <Activity className="text-blue-400" size={22} />}
          {advisor.type === 'rest' && <Coffee className="text-orange-500" size={22} />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-bold text-white text-base truncate">Tive Coach</h3>
            <div className="px-1.5 py-0.5 rounded flex items-center gap-1 bg-brand-primary/10 border border-brand-primary/20 shrink-0">
              <Sparkles className="text-brand-primary" size={10} />
              <span className="text-[9px] text-brand-primary font-bold tracking-widest uppercase">
                AI Powered
              </span>
            </div>
          </div>
          
          <p className="text-xs text-zinc-400 mb-3 leading-relaxed line-clamp-2">
            {advisor.reason}
          </p>

          {advisor.type === 'routine' && advisor.routineId && (
            <button 
              onClick={() => onStartRoutine?.(advisor.routineId!)}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-primaryHover transition-colors uppercase tracking-wider"
            >
              <Flame size={14} />
              <span className="truncate">Iniciar {advisor.routineName}</span>
              <ChevronRight size={14} className="opacity-50" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CoachCard;
