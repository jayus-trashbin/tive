import React, { useState, useMemo } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    useDroppable,
    useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, X, ChevronLeft, Calendar, Zap, BarChart2, Trash2, RotateCcw, CheckCircle2, Archive
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useMesocycleStore, MesocycleFocus, MesocyclePlan } from '../../store/useMesocycleStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { VOLUME_LANDMARKS, getVolumeZone, getVolumeZoneColor, getVolumeZoneLabel } from '../../engine/volumeLandmarks';
import { MuscleGroup } from '../../types/domain';
import { Button, IconButton, EmptyState } from '../ui';


// ─── Draggable Routine Chip ─────────────────────────────────────────────────

interface DraggableChipProps {
    routineId: string;
    name: string;
    color: string;
}

const DraggableChip: React.FC<DraggableChipProps> = ({ routineId, name, color }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `routine-${routineId}`,
        data: { routineId },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                'px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-grab active:cursor-grabbing whitespace-nowrap select-none touch-none',
                color
            )}
        >
            {name.length > 14 ? name.slice(0, 13) + '…' : name}
        </div>
    );
};

// ─── Droppable Day Cell ──────────────────────────────────────────────────────

interface DroppableDayProps {
    weekNumber: number;
    dayIndex: number;
    routineId: string | null;
    routineName?: string;
    isDeload: boolean;
    onClear: () => void;
}

const DAY_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const DroppableDay: React.FC<DroppableDayProps> = ({
    weekNumber, dayIndex, routineId, routineName, isDeload, onClear
}) => {
    const dropId = `day-${weekNumber}-${dayIndex}`;
    const { setNodeRef, isOver } = useDroppable({ id: dropId });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'relative flex flex-col items-center justify-center rounded-lg border transition-all min-h-[48px] min-w-[40px]',
                isDeload
                    ? 'border-zinc-800 bg-zinc-900/30 opacity-40'
                    : isOver
                    ? 'border-brand-primary bg-brand-primary/10'
                    : routineId
                    ? 'border-zinc-700 bg-zinc-900'
                    : 'border-zinc-800/50 bg-zinc-900/20 border-dashed'
            )}
        >
            <span className="text-[8px] text-zinc-600 font-medium absolute top-0.5 left-1">
                {DAY_SHORT[dayIndex]}
            </span>
            {isDeload ? (
                <span className="text-[8px] text-zinc-600 font-medium">—</span>
            ) : routineId ? (
                <>
                    <span className="text-[8px] font-medium text-brand-primary text-center leading-tight px-1 mt-2">
                        {(routineName ?? 'Routine').length > 6
                            ? (routineName ?? 'Routine').slice(0, 5) + '…'
                            : routineName ?? 'Routine'}
                    </span>
                    <button
                        onPointerDown={e => { e.stopPropagation(); onClear(); }}
                        className="absolute top-0.5 right-0.5 text-zinc-600 hover:text-red-400 transition-colors p-1"
                        aria-label="Clear routine from day"
                    >
                        <X size={10} />
                    </button>

                </>
            ) : (
                <span className="text-[8px] text-zinc-700 font-medium mt-2">+</span>
            )}
        </div>
    );
};

// ─── Volume Projection Bar ───────────────────────────────────────────────────

interface VolumeProjectionProps {
    plan: MesocyclePlan;
    routinesById: Map<string, { name: string; muscleCount: Record<MuscleGroup, number> }>;
}

const VolumeProjection: React.FC<VolumeProjectionProps> = ({ plan, routinesById }) => {
    const weeklyVolume = useMemo(() => {
        const volume: Record<MuscleGroup, number> = {
            chest: 0, back: 0, 'upper legs': 0, 'lower legs': 0,
            shoulders: 0, arms: 0, core: 0, cardio: 0,
        };

        plan.weeks.forEach(week => {
            if (week.isDeload) return;
            week.days.forEach(day => {
                if (!day.routineId) return;
                const routineData = routinesById.get(day.routineId);
                if (!routineData) return;
                (Object.keys(routineData.muscleCount) as MuscleGroup[]).forEach(m => {
                    volume[m] = (volume[m] || 0) + routineData.muscleCount[m];
                });
            });
        });

        return volume;
    }, [plan, routinesById]);

    const muscles = (Object.keys(weeklyVolume) as MuscleGroup[]).filter(m => weeklyVolume[m] > 0);

    if (muscles.length === 0) return null;

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={12} className="text-brand-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Weekly Volume Projection
                </span>
            </div>
            <div className="space-y-2">
                {muscles.map(muscle => {
                    const sets = weeklyVolume[muscle];
                    const zone = getVolumeZone(muscle, sets);
                    const color = getVolumeZoneColor(zone);
                    const mrv = VOLUME_LANDMARKS[muscle].mrv;
                    const pct = Math.min(100, (sets / mrv) * 100);

                    return (
                        <div key={muscle}>
                            <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[9px] font-medium text-zinc-400 capitalize">{muscle}</span>
                                <span className={cn('text-[9px] font-bold', color)}>
                                    {sets} sets/wk
                                </span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    className={cn(
                                        'h-full rounded-full',
                                        zone === 'mav' ? 'bg-brand-success' :
                                        zone === 'mrv' ? 'bg-brand-warning' :
                                        zone === 'over_mrv' ? 'bg-brand-danger' :
                                        zone === 'mev' ? 'bg-blue-400' : 'bg-zinc-600'
                                    )}
                                />
                            </div>
                            <div className="text-[8px] font-medium text-zinc-600 mt-0.5">
                                {getVolumeZoneLabel(zone)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Create Plan Form ────────────────────────────────────────────────────────

interface CreatePlanFormProps {
    onCreate: (name: string, weeks: number, focus: MesocycleFocus) => void;
    onCancel: () => void;
}

const FOCUS_OPTIONS: { value: MesocycleFocus; label: string; desc: string }[] = [
    { value: 'hypertrophy', label: 'Hypertrophy', desc: 'High volume, moderate load' },
    { value: 'strength', label: 'Strength', desc: 'Low reps, high intensity' },
    { value: 'power', label: 'Power', desc: 'Speed & explosiveness' },
];

const CreatePlanForm: React.FC<CreatePlanFormProps> = ({ onCreate, onCancel }) => {
    const [name, setName] = useState('');
    const [weeks, setWeeks] = useState(4);
    const [focus, setFocus] = useState<MesocycleFocus>('hypertrophy');

    const handleSubmit = () => {
        if (!name.trim()) return;
        onCreate(name.trim(), weeks, focus);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 space-y-5"
        >
            <div>
                <label className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest block mb-1.5">
                    Plan Name
                </label>
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. PPL Hypertrophy Block"
                    className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-lg font-medium text-sm focus:outline-none focus:border-brand-primary/50"
                />
            </div>

            <div>
                <label className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest block mb-1.5">
                    Duration
                </label>
                <div className="flex gap-2">
                    {[4, 5, 6].map(w => (
                        <button
                            key={w}
                            onClick={() => setWeeks(w)}
                            className={cn(
                                'flex-1 py-3 text-xs font-bold rounded-lg border transition-all',
                                weeks === w
                                    ? 'bg-brand-primary text-black border-brand-primary'
                                    : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'
                            )}
                        >
                            {w}W
                        </button>
                    ))}
                </div>
                <p className="text-[9px] font-medium text-zinc-600 mt-1">
                    Week {weeks} will auto-mark as Deload
                </p>
            </div>

            <div>
                <label className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest block mb-1.5">
                    Focus
                </label>
                <div className="space-y-2">
                    {FOCUS_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setFocus(opt.value)}
                            className={cn(
                                'w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all',
                                focus === opt.value
                                    ? 'border-brand-primary bg-brand-primary/10'
                                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                            )}
                        >
                            <div>
                                <div className={cn('text-xs font-bold',
                                    focus === opt.value ? 'text-brand-primary' : 'text-white'
                                )}>
                                    {opt.label}
                                </div>
                                <div className="text-[9px] font-medium text-zinc-500">{opt.desc}</div>
                            </div>
                            {focus === opt.value && (
                                <div className="w-2 h-2 rounded-full bg-brand-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={handleSubmit}
                    disabled={!name.trim()}
                >
                    Create Plan
                </Button>
            </div>

        </motion.div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface MesocyclePlannerProps {
    onBack: () => void;
}

const FOCUS_COLOR: Record<MesocycleFocus, string> = {
    hypertrophy: 'text-green-400 border-green-900 bg-green-900/20',
    strength: 'text-blue-400 border-blue-900 bg-blue-900/20',
    power: 'text-orange-400 border-orange-900 bg-orange-900/20',
};

const MesocyclePlanner: React.FC<MesocyclePlannerProps> = ({ onBack }) => {
    const { activePlan, plans, createPlan, assignRoutine, toggleDeload, deletePlan, setActivePlan, completePlan } =
        useMesocycleStore();
    const { routines, exercises } = useWorkoutStore();

    const [showCreate, setShowCreate] = useState(false);
    const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
    const [showArchive, setShowArchive] = useState(false);

    const activePlans = useMemo(() => plans.filter(p => !p.completedAt), [plans]);
    const archivedPlans = useMemo(
        () => [...plans.filter(p => p.completedAt)].sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
        [plans]
    );

    // Sensors: require 8px movement before drag starts (prevents accidental drags on mobile)
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
    );

    const visibleRoutines = useMemo(
        () => routines.filter(r => !r.deletedAt),
        [routines]
    );

    // Pre-compute muscle set counts per routine for volume projection
    const routinesById = useMemo(() => {
        const map = new Map<string, { name: string; muscleCount: Record<MuscleGroup, number> }>();
        visibleRoutines.forEach(routine => {
            const muscleCount: Record<MuscleGroup, number> = {
                chest: 0, back: 0, 'upper legs': 0, 'lower legs': 0,
                shoulders: 0, arms: 0, core: 0, cardio: 0,
            };
            (routine.blocks ?? []).forEach(block => {
                const ex = exercises.find(e => e.id === block.exerciseId);
                if (ex) muscleCount[ex.targetMuscle] = (muscleCount[ex.targetMuscle] || 0) + block.sets.filter(s => s.type === 'working').length;
            });
            map.set(routine.id, { name: routine.name, muscleCount });
        });
        return map;
    }, [visibleRoutines, exercises]);

    const handleDragStart = (event: DragStartEvent) => {
        const routineId = (event.active.data.current as any)?.routineId;
        setActiveRoutineId(routineId ?? null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveRoutineId(null);
        const { active, over } = event;
        if (!over || !activePlan) return;

        const routineId = (active.data.current as any)?.routineId as string;
        const overId = over.id as string; // "day-{weekNumber}-{dayIndex}"

        const match = overId.match(/^day-(\d+)-(\d+)$/);
        if (!match) return;

        const weekNumber = parseInt(match[1], 10);
        const dayIndex = parseInt(match[2], 10);

        const week = activePlan.weeks.find(w => w.weekNumber === weekNumber);
        if (!week || week.isDeload) return;

        assignRoutine(activePlan.id, weekNumber, dayIndex, routineId);
    };

    const handleClearDay = (weekNumber: number, dayIndex: number) => {
        if (!activePlan) return;
        assignRoutine(activePlan.id, weekNumber, dayIndex, null);
    };

    // Empty state: no plans
    if (activePlans.length === 0 && !showCreate) {
        return (
            <div className="flex flex-col h-full bg-black">
                <header
                    className="shrink-0 px-5 pb-4 border-b border-zinc-900 bg-zinc-950/80 flex items-center gap-3"
                    style={{ paddingTop: `calc(var(--sat) + 1.25rem)` }}
                >
                    <IconButton
                        icon={ChevronLeft}
                        onClick={onBack}
                        variant="ghost"
                        size="md"
                        aria-label="Back"
                        className="-ml-2"
                    />

                    <div>
                        <div className="section-title">Training Block</div>
                        <h1 className="page-title">Mesocycle<span className="text-brand-primary">_</span>Planner</h1>
                    </div>
                </header>
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <EmptyState
                        icon={Calendar}
                        title="No Training Blocks Yet"
                        description="Plan your 4-6 week mesocycle to optimize your volume and recovery."
                        action={{
                            label: "Create Block",
                            onClick: () => setShowCreate(true),
                            variant: "primary",
                            iconLeft: Plus
                        }}
                    />
                </div>

            </div>
        );
    }

    if (showCreate) {
        return (
            <div className="flex flex-col h-full bg-black overflow-y-auto">
                <header
                    className="shrink-0 px-5 py-4 border-b border-zinc-900 flex items-center gap-3"
                    style={{ paddingTop: `calc(var(--sat) + 1.25rem)` }}
                >
                    <IconButton
                        icon={ChevronLeft}
                        onClick={() => setShowCreate(false)}
                        variant="ghost"
                        size="md"
                        aria-label="Back"
                        className="-ml-2"
                    />

                    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-medium">New Training Block</h2>
                </header>
                <CreatePlanForm
                    onCreate={(name, weeks, focus) => {
                        createPlan(name, weeks, focus);
                        setShowCreate(false);
                    }}
                    onCancel={() => setShowCreate(false)}
                />
            </div>
        );
    }

    const currentPlan = activePlan ?? activePlans[0];

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-full bg-black overflow-hidden">
                {/* Header */}
                <header
                    className="shrink-0 px-5 pb-4 border-b border-zinc-900 bg-zinc-950/80"
                    style={{ paddingTop: `calc(var(--sat) + 1.25rem)` }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <IconButton
                            icon={ChevronLeft}
                            onClick={onBack}
                            variant="ghost"
                            size="md"
                            aria-label="Back"
                            className="-ml-2"
                        />

                        <div className="flex-1 min-w-0">
                            <div className="section-title">Training Block</div>
                            <h1 className="page-title truncate">
                                {currentPlan.name}<span className="text-brand-primary">_</span>
                            </h1>
                        </div>
                        <IconButton
                            icon={Plus}
                            onClick={() => setShowCreate(true)}
                            variant="ghost"
                            size="sm"
                            aria-label="New Plan"
                        />
                        <IconButton
                            icon={CheckCircle2}
                            onClick={() => {
                                if (confirm('Mark this block as completed and archive it?')) {
                                    completePlan(currentPlan.id);
                                }
                            }}
                            variant="ghost"
                            size="sm"
                            aria-label="Complete Block"
                        />
                        <IconButton
                            icon={Trash2}
                            onClick={() => { if (confirm('Delete this plan?')) deletePlan(currentPlan.id); }}
                            variant="ghost"
                            size="sm"
                            aria-label="Delete Plan"
                        />

                    </div>

                    <div className="flex items-center gap-2">
                        <span className={cn(
                            'px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase',
                            FOCUS_COLOR[currentPlan.focus]
                        )}>
                            {currentPlan.focus}
                        </span>
                        <span className="text-[9px] font-medium text-zinc-600">
                            {currentPlan.totalWeeks} weeks · Auto-deload W{currentPlan.totalWeeks}
                        </span>
                    </div>

                    {/* Plan selector (active plans only) */}
                    {activePlans.length > 1 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                            {activePlans.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setActivePlan(p.id)}
                                    className={cn(
                                        'shrink-0 px-3 py-1 rounded-lg border text-[9px] font-bold uppercase transition-all',
                                        currentPlan.id === p.id
                                            ? 'bg-brand-primary text-black border-brand-primary'
                                            : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
                                    )}
                                >
                                    {p.name.length > 12 ? p.name.slice(0, 11) + '…' : p.name}
                                </button>
                            ))}
                        </div>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                    {/* Routine Palette */}
                    <div className="px-5 pt-4 pb-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={10} className="text-brand-primary" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                                Drag routines to days
                            </span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {visibleRoutines.length === 0 ? (
                                <span className="text-[9px] font-medium text-zinc-700">No routines — create some first</span>
                            ) : (
                                visibleRoutines.map(r => (
                                    <DraggableChip
                                        key={r.id}
                                        routineId={r.id}
                                        name={r.name}
                                        color="border-zinc-700 text-zinc-300 bg-zinc-900"
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Week Grid */}
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.05 } }
                        }}
                        className="px-5 space-y-3 mt-2"
                    >
                        {currentPlan.weeks.map(week => (
                            <motion.div 
                                key={week.weekNumber}
                                variants={{
                                    hidden: { opacity: 0, y: 10 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                className={cn(
                                    'border rounded-lg overflow-hidden',
                                    week.isDeload ? 'border-zinc-800/50' : 'border-zinc-800'
                                )}
                            >
                                {/* Week Header */}
                                <div className={cn(
                                    'flex items-center justify-between px-3 py-2',
                                    week.isDeload ? 'bg-zinc-900/30' : 'bg-zinc-900/60'
                                )}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase">
                                            Week {week.weekNumber}
                                        </span>
                                        {week.isDeload && (
                                            <span className="px-1.5 py-0.5 bg-blue-900/40 border border-blue-800/40 rounded-lg text-[8px] font-medium text-blue-400 uppercase tracking-wider">
                                                Deload
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        iconLeft={RotateCcw}
                                        onClick={() => toggleDeload(currentPlan.id, week.weekNumber)}
                                        className="h-7 px-2 text-[8px] text-zinc-500"
                                    >
                                        {week.isDeload ? 'Unmark' : 'Deload'}
                                    </Button>
                                </div>

                                {/* Day Grid */}
                                <div className="grid grid-cols-7 gap-1 p-2">
                                    {week.days.map(day => (
                                        <DroppableDay
                                            key={day.dayIndex}
                                            weekNumber={week.weekNumber}
                                            dayIndex={day.dayIndex}
                                            routineId={day.routineId}
                                            routineName={
                                                day.routineId
                                                    ? routinesById.get(day.routineId)?.name
                                                    : undefined
                                            }
                                            isDeload={week.isDeload}
                                            onClear={() => handleClearDay(week.weekNumber, day.dayIndex)}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>


                    {/* Volume Projection */}
                    <div className="px-5 mt-5">
                        <VolumeProjection plan={currentPlan} routinesById={routinesById} />
                    </div>

                    {/* Past Cycles Archive */}
                    {archivedPlans.length > 0 && (
                        <div className="px-5 mt-6">
                            <button
                                onClick={() => setShowArchive(v => !v)}
                                className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors mb-3"
                            >
                                <Archive size={11} />
                                Past Cycles ({archivedPlans.length})
                                <span className="ml-1">{showArchive ? '▲' : '▼'}</span>
                            </button>

                            <AnimatePresence>
                                {showArchive && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden space-y-2"
                                    >
                                        {archivedPlans.map(plan => (
                                            <div
                                                key={plan.id}
                                                className="flex items-center justify-between px-4 py-3 bg-zinc-900/40 border border-zinc-800/50 rounded-lg"
                                            >
                                                <div>
                                                    <p className="text-xs font-bold text-zinc-300">{plan.name}</p>
                                                    <p className="text-[9px] text-zinc-600 mt-0.5">
                                                        <span className={cn('capitalize', FOCUS_COLOR[plan.focus].split(' ')[0])}>
                                                            {plan.focus}
                                                        </span>
                                                        {' · '}{plan.totalWeeks}W
                                                        {' · completed '}
                                                        {plan.completedAt
                                                            ? new Date(plan.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                                            : '—'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => { if (confirm('Delete this archived cycle?')) deletePlan(plan.id); }}
                                                    className="text-zinc-700 hover:text-red-400 transition-colors p-1"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeRoutineId ? (
                        <div className="px-3 py-1.5 rounded-lg border border-brand-primary bg-brand-primary/10 text-[10px] font-bold uppercase tracking-wider text-brand-primary shadow-lg whitespace-nowrap">
                            {routinesById.get(activeRoutineId)?.name ?? 'Routine'}
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default MesocyclePlanner;
