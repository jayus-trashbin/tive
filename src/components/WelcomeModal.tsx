import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Check, Dumbbell, User, Activity, ArrowRight, Moon, Zap, Scale, Loader2 } from 'lucide-react';
import { FALLBACK_EXERCISES } from '../data/fallbackExercises';
import { getTemplateForProfile } from '../data/routineTemplates';
import { Routine, Gender } from '../types';
import { cn } from '../lib/utils';
import { useTranslation } from '../i18n';

interface Props {
  onComplete: () => void;
}

const WelcomeModal: React.FC<Props> = ({ onComplete }) => {
  const { updateUserStats, saveRoutine, addExercise } = useWorkoutStore();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  
  // Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [weight, setWeight] = useState(75);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [goal, setGoal] = useState<'strength' | 'hypertrophy'>('strength');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [theme, setTheme] = useState<'dark' | 'oled'>('dark');
  
  const [isBuilding, setIsBuilding] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<Routine | null>(null);

  const getRoutineName = (): string => {
    if (goal === 'strength') {
      return experience === 'beginner'
        ? t('onboarding.routineNames.foundationStrength')
        : t('onboarding.routineNames.advancedStrength');
    }
    return experience === 'beginner'
      ? t('onboarding.routineNames.baseHypertrophy')
      : t('onboarding.routineNames.hyperHypertrophy');
  };

  const generateRoutine = async () => {
    setIsBuilding(true);
    setStep(4);

    // Simulate thinking/generation delay for premium feel
    await new Promise(r => setTimeout(r, 1800));

    // Pick the template that best matches the user's profile
    const template = getTemplateForProfile(experience, goal);

    // Register all exercises that appear in the template into the store
    const templateExerciseIds = template.blocks?.map(b => b.exerciseId) ?? template.exerciseIds;
    templateExerciseIds.forEach(id => {
      const ex = FALLBACK_EXERCISES.find(e => e.id === id);
      if (ex) addExercise(ex);
    });

    const routine: Routine = {
      ...template,
      name: getRoutineName(),
      lastPerformed: undefined,
    };

    setGeneratedRoutine(routine);
    setIsBuilding(false);
  };

  const handleFinish = () => {
    updateUserStats({
      name,
      gender,
      bodyweight: weight,
      experienceLevel: experience,
      isOnboarded: true,
      unitSystem,
      theme,
    });
    
    if (generatedRoutine) {
      saveRoutine(generatedRoutine);
    }
    
    onComplete();
  };

  const nextStep = () => {
      if (step === 3) {
          generateRoutine();
      } else {
          setStep(prev => prev + 1);
      }
  };
  const prevStep = () => setStep(prev => prev - 1);

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  return (
    <div className="fixed inset-0 z-modal bg-black text-white flex flex-col overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-brand-primary/10 blur-[140px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Progress Header */}
      {step < 4 && (
        <div className="relative z-10 px-6 pt-safe mt-12 flex justify-between items-center max-w-md mx-auto w-full">

            <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                    <motion.div 
                        key={i}
                        animate={{ 
                            width: step === i ? 32 : 8,
                            backgroundColor: step >= i ? '#ffffff' : '#27272a'
                        }}
                        className="h-1.5 rounded-full"
                    />
                ))}
            </div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                {t('onboarding.stepOf', { current: String(step), total: '3' })}
            </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 flex flex-col px-6">
        <AnimatePresence mode='wait'>
            
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
                <motion.div 
                    key="step1"
                    variants={containerVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full"
                >
                    <div className="mb-10 text-center">
                        <motion.div 
                            initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }}
                            className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,255,255,0.2)] mx-auto"
                        >
                            <User size={32} className="text-black" />
                        </motion.div>
                        <h1 className="text-4xl font-bold mb-3 tracking-tight">
                            {t('onboarding.step1.title')}{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-400">
                                {t('onboarding.step1.titleHighlight')}
                            </span>
                        </h1>
                        <p className="text-zinc-400 text-lg">{t('onboarding.step1.subtitle')}</p>
                    </div>

                    <div className="space-y-6">
                        {/* Name Input */}
                        <div className="relative group">
                            <label htmlFor="welcome-name" className="sr-only">{t('onboarding.step1.nameLabel')}</label>
                            <input
                                id="welcome-name"
                                autoFocus
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('onboarding.step1.namePlaceholder')}
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-5 text-xl font-bold placeholder:text-zinc-600 focus:border-brand-primary focus:bg-black focus:outline-none transition-all"
                            />
                        </div>

                        {/* Gender Toggle */}
                        <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800">
                            {(['male', 'female'] as const).map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setGender(g)}
                                    className={cn(
                                        "flex-1 py-4 text-sm font-bold uppercase tracking-wider rounded-xl transition-all",
                                        gender === g 
                                            ? "bg-white text-black shadow-lg" 
                                            : "text-zinc-500 hover:text-white"
                                    )}
                                >
                                    {g === 'male' ? t('onboarding.step1.male') : t('onboarding.step1.female')}
                                </button>

                            ))}
                        </div>

                        {/* Weight Input */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-bold text-zinc-400 flex items-center gap-2"><Scale size={16}/> {t('onboarding.step1.bodyweightTitle')}</span>
                                <span className="text-2xl font-bold">{weight} <span className="text-sm text-zinc-500">KG</span></span>
                            </div>
                            <input
                                type="range"
                                aria-label={t('onboarding.step1.bodweightLabel')}
                                min="40" max="150" step="0.5"
                                value={weight}
                                onChange={(e) => setWeight(Number(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* STEP 2: EXPERIENCE */}
            {step === 2 && (
                <motion.div 
                    key="step2"
                    variants={containerVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full"
                >
                     <div className="mb-10 text-center">
                        <h1 className="text-4xl font-bold mb-3 tracking-tight">
                            {t('onboarding.step2.title')} <br/>
                            <span className="text-zinc-500">{t('onboarding.step2.titleSecondary')}</span>
                        </h1>
                        <p className="text-zinc-400">{t('onboarding.step2.subtitle')}</p>
                    </div>

                    <div className="space-y-4">
                        {([
                            { id: 'beginner', label: t('onboarding.step2.levels.beginner'), desc: t('onboarding.step2.levels.beginnerDesc'), vol: t('onboarding.step2.levels.beginnerVol') },
                            { id: 'intermediate', label: t('onboarding.step2.levels.intermediate'), desc: t('onboarding.step2.levels.intermediateDesc'), vol: t('onboarding.step2.levels.intermediateVol') },
                            { id: 'advanced', label: t('onboarding.step2.levels.advanced'), desc: t('onboarding.step2.levels.advancedDesc'), vol: t('onboarding.step2.levels.advancedVol') },
                        ] as const).map((level) => (
                            <button 
                                key={level.id}
                                onClick={() => setExperience(level.id as 'beginner' | 'intermediate' | 'advanced')}
                                className={cn(
                                    "w-full text-left p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden",
                                    experience === level.id 
                                        ? "border-brand-primary bg-brand-primary/10" 
                                        : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={cn("text-xl font-bold", experience === level.id ? "text-brand-primary" : "text-white")}>{level.label}</h3>
                                    <span className="text-xs font-bold text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md">{level.vol}</span>
                                </div>
                                <p className="text-sm text-zinc-400">{level.desc}</p>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* STEP 3: GOAL & PREFS */}
            {step === 3 && (
                 <motion.div 
                    key="step3"
                    variants={containerVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full"
                >
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold mb-3 tracking-tight">
                            {t('onboarding.step3.title')}{' '}
                            <span className="text-blue-400">{t('onboarding.step3.titleHighlight')}</span>
                        </h1>
                        <p className="text-zinc-400">{t('onboarding.step3.subtitle')}</p>
                    </div>

                    <div className="grid gap-4 mb-8">
                        <button 
                            onClick={() => setGoal('strength')}
                            className={cn(
                                "relative p-5 rounded-3xl border text-left transition-all duration-300",
                                goal === 'strength' ? "border-brand-primary bg-brand-primary/10" : "border-zinc-800 bg-zinc-900/40"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("p-3 rounded-2xl", goal === 'strength' ? "bg-brand-primary text-black" : "bg-zinc-800 text-zinc-400")}>
                                    <Dumbbell size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{t('onboarding.step3.strength')}</h3>
                                    <p className="text-sm text-zinc-400">{t('onboarding.step3.strengthDesc')}</p>
                                </div>
                            </div>
                        </button>

                        <button 
                            onClick={() => setGoal('hypertrophy')}
                            className={cn(
                                "relative p-5 rounded-3xl border text-left transition-all duration-300",
                                goal === 'hypertrophy' ? "border-blue-500 bg-blue-500/10" : "border-zinc-800 bg-zinc-900/40"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("p-3 rounded-2xl", goal === 'hypertrophy' ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-400")}>
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{t('onboarding.step3.hypertrophy')}</h3>
                                    <p className="text-sm text-zinc-400">{t('onboarding.step3.hypertrophyDesc')}</p>
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Unit System */}
                        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-3">{t('onboarding.step3.units')}</p>
                            <div className="flex gap-2">
                                {(['metric', 'imperial'] as const).map(u => (
                                    <button
                                        key={u}
                                        onClick={() => setUnitSystem(u)}
                                        className={cn(
                                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                            unitSystem === u ? "bg-white text-black" : "bg-zinc-800 text-zinc-400"
                                        )}
                                    >
                                        {u === 'metric' ? t('settings.prefs.unitsKg') : t('settings.prefs.unitsLbs')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme */}
                        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-3">{t('onboarding.step3.theme')}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={cn(
                                        "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex justify-center",
                                        theme === 'dark' ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-400"
                                    )}
                                >
                                    <Moon size={14} />
                                </button>
                                <button
                                    onClick={() => setTheme('oled')}
                                    className={cn(
                                        "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex justify-center",
                                        theme === 'oled' ? "bg-black text-brand-primary border border-brand-primary/30" : "bg-zinc-800 text-zinc-400"
                                    )}
                                >
                                    <Zap size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

             {/* STEP 4: PREVIEW / BUILDING */}
             {step === 4 && (
                <motion.div
                    key="step4"
                    variants={containerVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full"
                >
                    {isBuilding ? (
                        <>
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className="text-brand-primary mb-6"
                            >
                                <Loader2 size={48} />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-white mb-2">{t('onboarding.generating.title')}</h2>
                            <p className="text-zinc-500">{t('onboarding.generating.subtitle')}</p>
                        </>
                    ) : (
                        <>
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
                                className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(190,242,100,0.3)]"
                            >
                                <Check size={40} className="text-black" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-white mb-2">{t('onboarding.ready.title')}</h2>
                            <p className="text-zinc-400 mb-8">{t('onboarding.ready.subtitle')}</p>

                            {generatedRoutine && (() => {
                                // Use block exerciseIds for accurate preview
                                const blockIds = generatedRoutine.blocks?.map(b => b.exerciseId)
                                    ?? generatedRoutine.exerciseIds;
                                const totalCount = blockIds.length;
                                const previewIds = blockIds.slice(0, 3);
                                const remainingCount = totalCount - previewIds.length;

                                return (
                                    <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 text-left mb-8">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-white">{generatedRoutine.name}</h3>
                                            <span className="text-xs font-bold bg-brand-primary/20 text-brand-primary px-2 py-1 rounded">
                                                {t('onboarding.ready.exercisesLabel', { count: String(totalCount) })}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {previewIds.map(id => {
                                                const ex = FALLBACK_EXERCISES.find(e => e.id === id);
                                                return (
                                                    <div key={id} className="text-sm text-zinc-400 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary/50" />
                                                        <span>{ex?.name ?? id}</span>
                                                        {ex?.targetMuscle && (
                                                            <span className="ml-auto text-caption-xs text-zinc-600 capitalize">{ex.targetMuscle}</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {remainingCount > 0 && (
                                                <div className="text-sm text-zinc-600 pl-3.5">
                                                    {t('onboarding.ready.moreExercises', { count: String(remainingCount) })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            <button 
                                onClick={handleFinish}
                                className="w-full py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
                            >
                                {t('onboarding.enterApp')}
                            </button>
                        </>
                    )}
                </motion.div>
            )}

        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      {step < 4 && (
          <div className="relative z-10 p-6 pt-0 pb-safe max-w-md mx-auto w-full">
            <div className="flex gap-3">
                {step > 1 && (
                    <button 
                        onClick={prevStep}
                        className="h-16 w-16 shrink-0 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
                    >
                        <ArrowRight className="rotate-180" size={24} />
                    </button>
                )}
                
                <button 
                    onClick={nextStep}
                    disabled={step === 1 && name.trim().length === 0}
                    className={cn(
                        "h-16 flex-1 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg transition-all active:scale-[0.98]",
                        step === 1 && name.trim().length === 0
                            ? "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800" 
                            : "bg-white text-black shadow-lg hover:bg-zinc-200"
                    )}
                >
                    {step === 3 ? t('onboarding.buildRoutine') : t('onboarding.continue')}
                    {step < 3 && <ArrowRight size={20} />}
                </button>
            </div>
          </div>
      )}

    </div>
  );
};

export default WelcomeModal;
