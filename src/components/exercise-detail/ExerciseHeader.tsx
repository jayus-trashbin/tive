
import React from 'react';
import { X } from 'lucide-react';
import { Exercise } from '../../types';
import { SmartExerciseMedia } from '../ui/SmartExerciseMedia';

interface Props {
    exercise: Exercise;
    onClose: () => void;
    isFetchingDetails: boolean;
}

export const ExerciseHeader: React.FC<Props> = ({ exercise, onClose, isFetchingDetails }) => {
    return (
        <div className="relative shrink-0">
            <SmartExerciseMedia exercise={exercise} isFetchingDetails={isFetchingDetails} />

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors z-30 active:scale-90"
                style={{ top: 'calc(0.75rem + env(safe-area-inset-top))' }}
            >
                <X size={18} />
            </button>
        </div>
    );
};
