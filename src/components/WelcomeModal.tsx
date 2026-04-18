
import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { ChevronRight, Check, Dumbbell, User, Target, ArrowRight, Activity, Moon, Zap } from 'lucide-react';
import { FALLBACK_EXERCISES } from '../data/fallbackExercises';
import { Routine } from '../types';
import { cn } from '../lib/utils';

interface Props {
  onComplete: () => void;
}

const WelcomeModal: React.FC<Props> = ({ onComplete }) => {
  const { updateUserStats, saveRoutine, addExercise } = useWorkoutStore();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState(75);
  const [goal, setGoal] = useState<'strength' | 'hypertrophy'>('strength');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [theme, setTheme] = useState<'dark' | 'oled'>('dark');
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = async () => {
    setIsFinishing(true);

    // Artificial delay for "Setting up..." feeling
    await new Promise(r => setTimeout(r, 1500));

    // 1. Update User Stats
    updateUserStats({
      name,
      bodyweight: weight,
      isOnboarded: true,
      unitSystem,
      theme,
    });

    // 2. Create Starter Routine
    const starterExercises = FALLBACK_EXERCISES.slice(0, 5);
    starterExercises.forEach(ex => addExercise(ex));

    const starterRoutine: Routine = {
      id: crypto.randomUUID(),
      name: goal === 'strength' ? "Foundation Strength A" : "Muscle Building A",
      exerciseIds: starterExercises.map(e => e.id),
      lastPerformed: undefined
    };

    saveRoutine(starterRoutine);
    onComplete();
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Progress Header */}
      <div className="relative z-10 px-6 pt-safe mt-6 flex justify-between items-center">
         <div className="flex gap-1.5">
            {[1, 2, 3].map(i => (
                <motion.div 
                    key={i}
                    animate={{ 
                        width: step === i ? 24 : 6,
                        backgroundColor: step >= i ? '#ffffff' : '#3f3f46'
                    }}
                    className="h-1.5 rounded-full"
                />
            ))}
         </div>
         <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Step {step} of 3
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 flex flex-col px-6">
        <AnimatePresence mode='wait'>
            
            {/* STEP 1: NAME */}
            {step === 1 && (
                <motion.div 
                    key="step1"
                    variants={containerVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="flex-1 flex flex-col justify-center"
                >
                    <div className="mb-8">
                        <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }} 
                            className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                        >
                            <User size={32} className="text-black" />
                        </motion.div>
                        <h1 className="text-4xl font-black mb-3 leading-tight">What should we <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-400">call you?</span></h1>
                        <p className="text-zinc-400 text-lg">Your identity is the start of your journey.</p>
                    </div>

                    <div className="relative">
                        <input 
                            autoFocus
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter Name"
                            className="w-full bg-transparent border-b-2 border-zinc-800 py-4 text-3xl font-bold placeholder:text-zinc-700 focus:border-white focus:outline-none transition-colors"
                        />
                    </div>
                </motion.div>
            )}

            {/* STEP 2: WEIGHT */}
            {step === 2 && (
                <motion.div 
                    key="step2"
                    variants={containerVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="flex-1 flex flex-col justify-center"
                >
                     <div className="mb-8">
                        <h1 className="text-4xl font-black mb-3">Current <br/><span className="text-zinc-500">Weight</span></h1>
                        <p className="text-zinc-400">We use this to calculate your relative strength (Wilks Score).</p>
                    </div>

                    <div className="flex flex-col items-center py-10">
                        <div className="flex items-baseline gap-2 mb-8">
                            <span className="text-8xl font-black tracking-tighter">{weight}</span>
                            <span className="text-xl font-bold text-zinc-500 uppercase">KG</span>
                        </div>
                        
                        <div className="relative w-full h-12 flex items-center">
                            {/* Custom Track */}
                            <div className="absolute left-0 right-0 h-2 bg-zinc-800 rounded-full" />
                            <div 
                                className="absolute left-0 h-2 bg-white rounded-full" 
                                style={{ width: `${((weight - 40) / (150 - 40)) * 100}%` }}
                            />
                            
                            {/* Input */}
                            <input 
                                type="range" 
                                min="40" 
                                max="150" 
                                step="0.5"
                                value={weight}
                                onChange={(e) => setWeight(Number(e.target.value))}
                                className="w-full h-12 absolute opacity-0 cursor-pointer touch-none z-10"
                            />

                            {/* Custom Thumb Visual (Reacts to input) */}
                             <div 
                                className="absolute w-8 h-8 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] flex items-center justify-center pointer-events-none transition-all"
                                style={{ left: `calc(${((weight - 40) / (150 - 40)) * 100}% - 16px)` }}
                            >
                                <div className="w-2 h-2 bg-black rounded-full" />
                            </div>
                        </div>

                        <div className="w-full flex justify-between text-xs text-zinc-600 font-bold uppercase mt-4 px-2">
                            <span>Light</span>
                            <span>Heavy</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* STEP 3: GOAL */}
            {step === 3 && !isFinishing && (
                 <motion.div 
                    key="step3"
                    variants={containerVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="flex-1 flex flex-col justify-center"
                >
                    <div className="mb-8">
                        <h1 className="text-4xl font-black mb-3">Primary <br/><span className="text-brand-primary">Focus</span></h1>
                        <p className="text-zinc-400">This helps us recommend the right routine structure.</p>
                    </div>

                    <div className="grid gap-4">
                        <button 
                            onClick={() => setGoal('strength')}
                            className={cn(
                                "relative p-6 rounded-3xl border-2 text-left transition-all duration-300 group overflow-hidden",
                                goal === 'strength' 
                                    ? "border-brand-primary bg-brand-primary/10" 
                                    : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900"
                            )}
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={cn("p-3 rounded-2xl", goal === 'strength' ? "bg-brand-primary text-white" : "bg-zinc-800 text-zinc-400")}>
                                    <Dumbbell size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Strength</h3>
                                    <p className="text-sm text-zinc-400">Max force, lower reps (1-5).</p>
                                </div>
                            </div>
                        </button>

                        <button 
                            onClick={() => setGoal('hypertrophy')}
                            className={cn(
                                "relative p-6 rounded-3xl border-2 text-left transition-all duration-300 group overflow-hidden",
                                goal === 'hypertrophy' 
                                    ? "border-blue-500 bg-blue-500/10" 
                                    : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900"
                            )}
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={cn("p-3 rounded-2xl", goal === 'hypertrophy' ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-400")}>
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Hypertrophy</h3>
                                    <p className="text-sm text-zinc-400">Muscle size, mid reps (8-12).</p>
                                </div>
                            </div>
                        </button>
                    </div>
                    {/* U-05: Unit System + Theme */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                        {/* Unit System */}
                        <div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Units</p>
                            <div className="flex gap-2">
                                {(['metric', 'imperial'] as const).map(u => (
                                    <button
                                        key={u}
                                        onClick={() => setUnitSystem(u)}
                                        className={cn(
                                            "flex-1 py-2.5 text-xs font-mono font-bold border rounded-[3px] transition-all",
                                            unitSystem === u
                                                ? "bg-white text-black border-white"
                                                : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700"
                                        )}
                                    >
                                        {u === 'metric' ? 'kg' : 'lbs'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme */}
                        <div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Theme</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={cn(
                                        "flex-1 py-2.5 text-xs font-mono font-bold border rounded-[3px] transition-all flex items-center justify-center gap-1",
                                        theme === 'dark'
                                            ? "bg-zinc-800 text-white border-zinc-600"
                                            : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700"
                                    )}
                                >
                                    <Moon size={10} /> Dark
                                </button>
                                <button
                                    onClick={() => setTheme('oled')}
                                    className={cn(
                                        "flex-1 py-2.5 text-xs font-mono font-bold border rounded-[3px] transition-all flex items-center justify-center gap-1",
                                        theme === 'oled'
                                            ? "bg-black text-brand-primary border-brand-primary/40"
                                            : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700"
                                    )}
                                >
                                    <Zap size={10} /> OLED
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

             {/* LOADING STATE */}
             {isFinishing && (
                <motion.div
                    key="finish"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center"
                >
                    <div className="w-20 h-20 relative mb-6">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-4 border-zinc-800 border-t-brand-primary"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="text-white" size={24} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Building Profile...</h2>
                    <p className="text-zinc-500 mt-2">Welcome to TIVE.</p>
                </motion.div>
            )}

        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      {!isFinishing && (
          <div className="relative z-10 p-6 pt-0 pb-safe">
            <div className="flex gap-4">
                {step > 1 && (
                    <button 
                        onClick={prevStep}
                        className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowRight className="rotate-180" size={24} />
                    </button>
                )}
                
                <button 
                    onClick={step === 3 ? handleFinish : nextStep}
                    disabled={step === 1 && !name}
                    className={cn(
                        "h-16 flex-1 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all active:scale-[0.98]",
                        step === 1 && !name 
                            ? "bg-zinc-900 text-zinc-600 cursor-not-allowed" 
                            : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    )}
                >
                    {step === 3 ? "FINISH SETUP" : "CONTINUE"}
                    {step < 3 && <ArrowRight size={20} />}
                </button>
            </div>
          </div>
      )}

    </div>
  );
};

export default WelcomeModal;
