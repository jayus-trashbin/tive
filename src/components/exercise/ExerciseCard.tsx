
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
    style?: React.CSSProperties;
}

const ExerciseCard: React.FC<Props> = ({ exercise, onClick, onInfoClick, compact = false, style }) => {
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
            style={style}
            layout
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "card relative overflow-hidden cursor-pointer group p-0 transition-all hover:border-zinc-700",
                compact ? "aspect-[1]" : "aspect-[16/9]"
            )}
        >
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0 bg-zinc-900">
                <ImageWithFallback
                    src={exercise.staticImageUrl || (exercise.gifUrl ? `https://wsrv.nl/?url=${encodeURIComponent(exercise.gifUrl)}&n=1&output=png` : '')}
                    alt={exercise.name}
                    className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                    fallbackIcon={<Dumbbell size={48} className="text-zinc-800" />}
                />
            </div>

            {/* Gradient Overlay for Text Readability */}
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
                <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-2 h-2 rounded-full", tagColor)} />
                    <span className="text-caption-xs font-bold uppercase tracking-widest text-zinc-400">
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
