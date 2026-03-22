
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RoutineBlock, Exercise, RoutineSet } from '../../types';
import { GripVertical, Trash2, Link, Unlink, Timer, ArrowRightToLine, Plus } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '../../lib/utils';

// --- SUB-COMPONENT: SetRow (Moved outside to prevent re-mount/focus loss) ---
interface SetRowProps {
  set: RoutineSet;
  idx: number;
  onUpdate: (setId: string, field: keyof RoutineSet, value: RoutineSet[keyof RoutineSet]) => void;
  onRemove: (setId: string) => void;
}

const SetRow: React.FC<SetRowProps> = ({ set, idx, onUpdate, onRemove }) => {
  return (
    <motion.div
      layout
      className="relative bg-zinc-900 border-b border-white/5 last:border-0"
    >
      {/* Background Action (Delete) */}
      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-end px-4">
        <Trash2 size={16} className="text-red-500" />
      </div>

      {/* Foreground Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        onDragEnd={(e, info: PanInfo) => {
          if (info.offset.x < -80) onRemove(set.id);
        }}
        className="relative bg-zinc-900 grid grid-cols-[30px_60px_1fr_1fr] gap-2 items-center py-3 px-2"
      >
        <span className="text-xs text-zinc-500 font-mono text-center">{idx + 1}</span>

        {/* Type Selector */}
        <button
          onClick={() => onUpdate(set.id, 'type', set.type === 'warmup' ? 'working' : set.type === 'working' ? 'failure' : 'warmup')}
          className={cn(
            "text-[10px] font-bold uppercase py-1.5 rounded text-center border transition-colors",
            set.type === 'warmup' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
              set.type === 'failure' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                "bg-zinc-800 text-zinc-400 border-zinc-700"
          )}
        >
          {set.type === 'working' ? 'Work' : set.type === 'warmup' ? 'Warm' : 'Fail'}
        </button>

        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            placeholder="-"
            value={set.targetWeight === 0 ? '' : set.targetWeight}
            onChange={(e) => onUpdate(set.id, 'targetWeight', e.target.value === '' ? 0 : parseFloat(e.target.value))}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm font-bold text-white text-center focus:border-brand-primary focus:outline-none"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-zinc-600 pointer-events-none">KG</span>
        </div>

        <div className="relative">
          <input
            type="text"
            inputMode="text"
            placeholder="-"
            value={set.targetReps}
            onChange={(e) => onUpdate(set.id, 'targetReps', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm font-bold text-white text-center focus:border-brand-primary focus:outline-none"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-zinc-600 pointer-events-none">REPS</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---

interface Props {
  block: RoutineBlock;
  exercise: Exercise;
  index: number;
  onUpdate: (updates: Partial<RoutineBlock>) => void;
  onRemove: () => void;
  isOverlay?: boolean; // For drag preview
}

const DraggableExerciseCard: React.FC<Props> = ({ block, exercise, index, onUpdate, onRemove, isOverlay }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging || isOverlay ? 999 : 'auto',
    opacity: isDragging ? 0.3 : 1
  };

  // --- ACTIONS ---

  const handleAddSet = () => {
    // Smart Duplicate Logic: Clone everything from the last set
    const lastSet = block.sets[block.sets.length - 1];

    const newSet: RoutineSet = {
      id: crypto.randomUUID(),
      type: lastSet ? lastSet.type : 'working',
      targetReps: lastSet ? lastSet.targetReps : '10',
      targetWeight: lastSet ? lastSet.targetWeight : 0,
      targetRpe: lastSet ? lastSet.targetRpe : 8,
    };

    onUpdate({ sets: [...block.sets, newSet] });
  };

  const handleUpdateSet = (setId: string, field: keyof RoutineSet, value: RoutineSet[keyof RoutineSet]) => {
    const updatedSets = block.sets.map(s => s.id === setId ? { ...s, [field]: value } : s);
    onUpdate({ sets: updatedSets });
  };

  const handleRemoveSet = (setId: string) => {
    onUpdate({ sets: block.sets.filter(s => s.id !== setId) });
  };

  const toggleSuperset = () => {
    onUpdate({ isSuperset: !block.isSuperset });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden transition-all",
        isDragging || isOverlay ? "shadow-2xl border-brand-primary/50 scale-105" : "shadow-sm",
        block.isSuperset && "mt-0 rounded-t-none border-t-0" // Superset visual merging
      )}
    >
      {/* Superset Link Line */}
      {block.isSuperset && (
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-500 z-20" />
      )}

      {/* Header */}
      <div className="flex flex-col border-b border-white/5 bg-zinc-800/50">
        <div className="flex items-center gap-3 p-3">
          {/* Drag Handle */}
          <div {...attributes} {...listeners} className="p-2 -ml-2 text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing touch-none">
            <GripVertical size={24} />
          </div>

          {/* Thumbnail */}
          <div className="w-10 h-10 rounded bg-black overflow-hidden shrink-0">
            <img src={exercise.staticImageUrl || exercise.gifUrl} className="w-full h-full object-cover opacity-80" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{exercise.name}</h4>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
              {exercise.targetMuscle}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="flex items-center gap-1">
            {/* Superset Toggle (Only valid if not first) */}
            {index > 0 && (
              <button
                onClick={toggleSuperset}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  block.isSuperset ? "text-blue-500 bg-blue-500/10" : "text-zinc-600 hover:text-blue-400"
                )}
              >
                {block.isSuperset ? <Unlink size={18} /> : <Link size={18} />}
              </button>
            )}

            <button
              type="button"
              // Important: Stop propagation so drag sensors don't capture this click
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-2 text-zinc-600 hover:text-red-500"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* --- REST CONFIGURATION --- */}
        <div className="flex divide-x divide-white/5 border-t border-white/5 bg-zinc-900/50">
          <div className="flex-1 flex items-center justify-center gap-2 p-2">
            <Timer size={12} className="text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Rest</span>
            <input
              type="number"
              inputMode="numeric"
              value={block.restSeconds || 90}
              onChange={(e) => onUpdate({ restSeconds: Number(e.target.value) })}
              className="w-12 bg-transparent text-xs font-bold text-white text-center border-b border-zinc-700 focus:border-brand-primary focus:outline-none"
            />
            <span className="text-[10px] text-zinc-600">s</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 p-2">
            <ArrowRightToLine size={12} className="text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Transition</span>
            <input
              type="number"
              inputMode="numeric"
              value={block.transitionSeconds || 180}
              onChange={(e) => onUpdate({ transitionSeconds: Number(e.target.value) })}
              className="w-12 bg-transparent text-xs font-bold text-white text-center border-b border-zinc-700 focus:border-brand-primary focus:outline-none"
            />
            <span className="text-[10px] text-zinc-600">s</span>
          </div>
        </div>

        {/* --- NOTES FIELD --- */}
        <div className="px-3 py-2 border-t border-white/5 bg-zinc-950/30">
          <input
            type="text"
            placeholder="Add notes (e.g., 'Focus on eccentric')"
            value={block.notes || ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            className="w-full bg-transparent text-xs text-zinc-400 placeholder:text-zinc-600 focus:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Sets Table */}
      <div className="bg-zinc-900">
        {/* Table Header */}
        <div className="grid grid-cols-[30px_60px_1fr_1fr] gap-2 py-1.5 px-2 border-b border-white/5 bg-zinc-950/30">
          <div className="text-[9px] text-zinc-600 text-center font-bold">#</div>
          <div className="text-[9px] text-zinc-600 text-center font-bold">TYPE</div>
          <div className="text-[9px] text-zinc-600 text-center font-bold">TARGET KG</div>
          <div className="text-[9px] text-zinc-600 text-center font-bold">REPS</div>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          <AnimatePresence initial={false}>
            {block.sets.map((set, i) => (
              <SetRow
                key={set.id}
                set={set}
                idx={i}
                onUpdate={handleUpdateSet}
                onRemove={handleRemoveSet}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Add Set Button */}
        <button
          onClick={handleAddSet}
          className="w-full py-4 bg-zinc-800/50 hover:bg-zinc-800 text-brand-primary text-xs font-bold uppercase flex items-center justify-center gap-2 border-t border-white/5 transition-colors"
        >
          <Plus size={16} /> Add Set
        </button>
      </div>
    </div>
  );
};

export default DraggableExerciseCard;
