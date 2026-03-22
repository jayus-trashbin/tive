
import React from 'react';
import { Exercise } from '../../types';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { Info, Dumbbell } from 'lucide-react';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface Props {
    exercise: Exercise;
    onClick?: () => void;
    onInfoClick?: () => void;
    compact?: boolean;
}

const ExerciseCard: React.FC<Props> = ({ exercise, onClick, onInfoClick, compact = false }) => {
    const muscleColors: Record<string, string> = {
        'upper legs': 'bg-orange-500',
        'lower legs': 'bg-yellow-600',
        legs: 'bg-orange-500', // Fallback
        chest: 'bg-blue-500',
        back: 'bg-emerald-500',
        shoulders: 'bg-purple-500',
        arms: 'bg-pink-500',
        core: 'bg-amber-500',
        cardio: 'bg-red-500'
    };

    const tagColor = muscleColors[exercise.targetMuscle] || 'bg-zinc-500';

    return (
        <motion.div
            layout
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-[2px] bg-zinc-950 border border-zinc-900 cursor-pointer group hover:border-zinc-700 transition-all",
                compact ? "aspect-[1]" : "aspect-[16/9]"
            )}
        >
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 bg-zinc-950 flex items-center justify-center p-0.5">
                <div className="w-full h-full relative overflow-hidden rounded-[inherit] bg-zinc-900">
                    {/* Tech Grid Background for transparent images */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)', backgroundSize: '8px 8px' }} />

                    <ImageWithFallback
                        src={exercise.staticImageUrl || exercise.gifUrl}
                        alt={exercise.name}
                        className={cn(
                            "w-full h-full object-cover transition-all duration-700 scale-100 group-hover:scale-110",
                            "grayscale group-hover:grayscale-0 opacity-80 group-hover:opacity-100" // Tech effect: B&W -> Color
                        )}
                        fallbackIcon={<Dumbbell size={48} className="text-zinc-800" />}
                    />
                </div>
            </div>

            {/* Gradient Overlay for Text Readability - Stronger at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-10 pointer-events-none" />

            {/* Info Button (Top Right) */}
            {onInfoClick && (
                <div className="absolute top-3 right-3 z-30">
                    <button
                        onClick={(e) => { e.stopPropagation(); onInfoClick(); }}
                        className="w-8 h-8 rounded-full bg-zinc-950/50 backdrop-blur-md flex items-center justify-center text-zinc-300 hover:bg-white hover:text-black transition-colors border border-white/10"
                    >
                        <Info size={16} />
                    </button>
                </div>
            )}

            {/* Content Layer */}
            <div className="absolute inset-0 p-5 flex flex-col justify-end z-20 pointer-events-none">
                <div className="flex items-center gap-2 mb-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]", tagColor)} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {exercise.targetMuscle}
                    </span>
                </div>
                <h3 className={cn("font-bold text-white leading-tight", compact ? "text-lg" : "text-2xl")}>
                    {exercise.name}
                </h3>
            </div>
        </motion.div>
    );
};

export default React.memo(ExerciseCard);
