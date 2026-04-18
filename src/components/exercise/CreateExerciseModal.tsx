import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Dumbbell, Save, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { Exercise, MuscleGroup } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
    onClose: () => void;
    onCreated?: (exercise: Exercise) => void;
}

const MUSCLE_OPTIONS: MuscleGroup[] = ['chest', 'back', 'upper legs', 'lower legs', 'shoulders', 'arms', 'core', 'cardio'];
const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Band', 'Kettlebell', 'Smith Machine', 'Other'];

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
    chest: 'bg-red-500/20 text-red-400 border-red-500/30',
    back: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'upper legs': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'lower legs': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    shoulders: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    arms: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    core: 'bg-green-500/20 text-green-400 border-green-500/30',
    cardio: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

/**
 * R-03 — Custom Exercise Creator.
 * Full form with name, muscle group, equipment, unilateral toggle, fatigue factor,
 * and optional GIF URL. Saves via addExercise store action.
 */
const CreateExerciseModal: React.FC<Props> = ({ onClose, onCreated }) => {
    const addExercise = useWorkoutStore(s => s.addExercise);

    const [name, setName] = useState('');
    const [targetMuscle, setTargetMuscle] = useState<MuscleGroup>('chest');
    const [equipment, setEquipment] = useState('Barbell');
    const [isUnilateral, setIsUnilateral] = useState(false);
    const [fatigueFactor, setFatigueFactor] = useState(1.0);
    const [gifUrl, setGifUrl] = useState('');
    const [instructions, setInstructions] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (!name.trim()) { setError('Exercise name is required.'); return; }
        if (name.trim().length < 3) { setError('Name must be at least 3 characters.'); return; }
        setError('');

        const exercise: Exercise = {
            id: crypto.randomUUID(),
            name: name.trim(),
            targetMuscle,
            equipment,
            isUnilateral,
            fatigueFactor,
            gifUrl: gifUrl.trim() || 'https://via.placeholder.com/300x300?text=Custom',
            staticImageUrl: gifUrl.trim() || undefined,
            instructions: instructions.trim()
                ? instructions.split('\n').map(s => s.trim()).filter(Boolean)
                : [],
            updatedAt: Date.now(),
        };

        addExercise(exercise);
        onCreated?.(exercise);
        onClose();
    };

    const content = (
        <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-end justify-center">
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                className="w-full max-w-lg bg-zinc-950 border-t border-zinc-800 rounded-t-[12px] max-h-[90vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <Dumbbell size={16} className="text-brand-primary" />
                        <h2 className="font-mono font-black text-white uppercase tracking-tighter text-base">
                            New Exercise
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-[3px] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar">

                    {/* Name */}
                    <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                            Exercise Name *
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={e => { setName(e.target.value); setError(''); }}
                            placeholder="e.g. Romanian Deadlift"
                            className="w-full bg-zinc-900 border border-zinc-800 px-3 py-3 text-white font-bold text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:border-brand-primary transition-colors rounded-[3px]"
                        />
                        {error && (
                            <p className="flex items-center gap-1.5 mt-1.5 text-[10px] text-red-400 font-mono">
                                <AlertCircle size={10} /> {error}
                            </p>
                        )}
                    </div>

                    {/* Target Muscle */}
                    <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                            Target Muscle *
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {MUSCLE_OPTIONS.map(m => (
                                <button
                                    key={m}
                                    onClick={() => setTargetMuscle(m)}
                                    className={cn(
                                        "px-2.5 py-1.5 text-[10px] font-mono font-black uppercase border rounded-[2px] transition-all",
                                        targetMuscle === m
                                            ? MUSCLE_COLORS[m]
                                            : 'text-zinc-500 border-zinc-800 hover:border-zinc-700'
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Equipment */}
                    <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                            Equipment
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {EQUIPMENT_OPTIONS.map(eq => (
                                <button
                                    key={eq}
                                    onClick={() => setEquipment(eq)}
                                    className={cn(
                                        "px-2.5 py-1.5 text-[10px] font-mono font-bold border rounded-[2px] transition-all",
                                        equipment === eq
                                            ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                                            : 'text-zinc-500 border-zinc-800 hover:border-zinc-700'
                                    )}
                                >
                                    {eq}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Unilateral + Fatigue Factor */}
                    <div className="flex items-center gap-4">
                        {/* Unilateral Toggle */}
                        <div className="flex-1 flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-[3px] px-4 py-3">
                            <div>
                                <p className="text-xs font-bold text-white font-mono">Unilateral</p>
                                <p className="text-[10px] text-zinc-500">Each side individually</p>
                            </div>
                            <button
                                onClick={() => setIsUnilateral(v => !v)}
                                className={cn("transition-colors", isUnilateral ? 'text-brand-primary' : 'text-zinc-600')}
                            >
                                {isUnilateral ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                            </button>
                        </div>

                        {/* Fatigue Factor */}
                        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-[3px] px-4 py-3">
                            <div className="flex justify-between items-center mb-1.5">
                                <p className="text-xs font-bold text-white font-mono">Fatigue Factor</p>
                                <span className="text-brand-primary font-mono font-black text-sm">{fatigueFactor.toFixed(1)}×</span>
                            </div>
                            <input
                                type="range"
                                min={0.5}
                                max={2.0}
                                step={0.1}
                                value={fatigueFactor}
                                onChange={e => setFatigueFactor(parseFloat(e.target.value))}
                                className="w-full accent-brand-primary"
                            />
                            <div className="flex justify-between text-[9px] text-zinc-600 font-mono mt-0.5">
                                <span>Low</span><span>High</span>
                            </div>
                        </div>
                    </div>

                    {/* GIF / Preview URL */}
                    <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                            GIF / Image URL <span className="text-zinc-700 normal-case">(optional)</span>
                        </label>
                        <input
                            type="url"
                            value={gifUrl}
                            onChange={e => setGifUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white text-sm font-mono placeholder:text-zinc-700 focus:outline-none focus:border-brand-primary transition-colors rounded-[3px]"
                        />
                        {gifUrl && (
                            <div className="mt-2 w-16 h-16 rounded-[3px] overflow-hidden bg-zinc-900 border border-zinc-800">
                                <img src={gifUrl} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                            </div>
                        )}
                    </div>

                    {/* Instructions */}
                    <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                            Instructions <span className="text-zinc-700 normal-case">(one step per line)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                            placeholder="Stand with feet shoulder-width apart..."
                            className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white text-sm font-mono placeholder:text-zinc-700 focus:outline-none focus:border-brand-primary transition-colors rounded-[3px] resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 px-5 py-4 border-t border-zinc-800 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono font-bold text-sm uppercase tracking-wider rounded-[3px] hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 bg-brand-primary text-black font-mono font-black text-sm uppercase tracking-wider rounded-[3px] flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
                    >
                        <Save size={14} /> Create Exercise
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return createPortal(content, document.body);
};

export default CreateExerciseModal;
