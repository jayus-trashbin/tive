import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, ChevronRight } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import MuscleOverlay from './MuscleOverlay';
import { getSessionMuscleIntensity } from '../../utils/analytics';

interface PostWorkoutPromptProps {
    onOpenCamera: () => void;
}

/**
 * Modal prompt shown after workout completion
 * Asks user if they want to take a progress photo
 */
const PostWorkoutPrompt: React.FC<PostWorkoutPromptProps> = ({ onOpenCamera }) => {
    const {
        showPostWorkoutPrompt,
        pendingMuscleGroups,
        dismissPostWorkoutPrompt,
        pendingSessionId,
        history,
        exercises
    } = useWorkoutStore();

    const session = useMemo(() => {
        if (!pendingSessionId) return null;
        return history.find(s => s.id === pendingSessionId);
    }, [pendingSessionId, history]);

    const activeVolumes = useMemo(() => {
        if (!session) return undefined;
        return getSessionMuscleIntensity(session, exercises);
    }, [session, exercises]);

    const handleTakePhoto = () => {
        dismissPostWorkoutPrompt();
        onOpenCamera();
    };

    const handleSkip = () => {
        dismissPostWorkoutPrompt();
    };

    return (
        <AnimatePresence>
            {showPostWorkoutPrompt && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-sm flex items-end justify-center p-4"
                    onClick={handleSkip}
                >
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-zinc-900 border border-zinc-800 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                                Workout Complete
                            </h3>
                            <button
                                onClick={handleSkip}
                                className="p-1 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                {/* Muscle Overlay Preview */}
                                <div className="flex-shrink-0">
                                    <MuscleOverlay
                                        muscleGroups={pendingMuscleGroups}
                                        volumes={activeVolumes}
                                        size={80}
                                    />
                                </div>

                                <div className="flex-1">
                                    <h4 className="font-mono text-lg font-bold text-white mb-1">
                                        Take Progress Photo?
                                    </h4>
                                    <p className="font-mono text-xs text-zinc-400 mb-4">
                                        Capture your post-workout state. Your trained muscles will be marked on the photo.
                                    </p>

                                    {/* Muscle Tags */}
                                    {pendingMuscleGroups.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {pendingMuscleGroups.slice(0, 5).map((muscle) => (
                                                <span
                                                    key={muscle}
                                                    className="px-2 py-1 bg-lime-400/10 border border-lime-400/30 font-mono text-[10px] text-lime-400 uppercase font-black"
                                                >
                                                    {muscle}
                                                </span>
                                            ))}
                                            {pendingMuscleGroups.length > 5 && (
                                                <span className="font-mono text-[10px] text-zinc-500 font-bold self-center">
                                                    +{pendingMuscleGroups.length - 5}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex border-t border-zinc-800">
                            <button
                                onClick={handleSkip}
                                className="flex-1 px-4 py-4 font-mono text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-center"
                            >
                                Skip
                            </button>
                            <div className="w-px bg-zinc-800" />
                            <button
                                onClick={handleTakePhoto}
                                className="flex-1 px-4 py-4 bg-lime-400 font-mono text-sm font-bold text-black flex items-center justify-center gap-2 hover:bg-lime-300 transition-colors"
                            >
                                <Camera size={18} />
                                <span>Take Photo</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PostWorkoutPrompt;
