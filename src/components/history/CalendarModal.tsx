import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Session } from '../../types';
import { cn } from '../../lib/utils';
import { Modal } from '../ui';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    onSelectDate: (date: Date | null) => void;
    sessions: Session[];
}

const CalendarModal: React.FC<Props> = ({ isOpen, onClose, selectedDate, onSelectDate, sessions }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Determine days with workouts
    const activeDays = useMemo(() => {
        const days = new Set<string>();
        sessions.forEach(s => {
            const d = new Date(s.date);
            days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
        });
        return days;
    }, [sessions]);

    // Calendar Grid Logic
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        // Padding for start of week
        for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
        // Real days
        for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));

        return days;
    }, [currentMonth]);

    const handleDayClick = (date: Date) => {
        // Toggle selection logic
        if (selectedDate &&
            selectedDate.getDate() === date.getDate() &&
            selectedDate.getMonth() === date.getMonth() &&
            selectedDate.getFullYear() === date.getFullYear()) {
            onSelectDate(null); // Deselect
        } else {
            onSelectDate(date);
        }
        onClose();
    };

    const changeMonth = (delta: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false}
            position="center"
            className="w-full max-w-sm border border-white/10 rounded-2xl shadow-2xl"
            bodyClassName="p-6"
        >
            <div style={{ marginBottom: `env(safe-area-inset-bottom)` }}>
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white">
                        <ChevronLeft size={20} />
                    </button>
                    <h3 className="text-lg font-bold text-white">
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <div key={d} className="text-caption-xs font-bold text-zinc-600">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date, i) => {
                        if (!date) return <div key={`empty-${i}`} />;

                        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                        const hasWorkout = activeDays.has(dateKey);
                        const isSelected = selectedDate &&
                            selectedDate.getDate() === date.getDate() &&
                            selectedDate.getMonth() === date.getMonth() &&
                            selectedDate.getFullYear() === date.getFullYear();

                        return (
                            <button
                                key={i}
                                onClick={() => handleDayClick(date)}
                                className={cn(
                                    "aspect-square rounded-full flex flex-col items-center justify-center relative transition-all text-sm font-medium",
                                    isSelected
                                        ? "bg-brand-primary text-white font-bold"
                                        : "text-zinc-400 hover:bg-zinc-800",
                                    !isSelected && hasWorkout && "text-white font-bold bg-white/5 border border-white/10"
                                )}
                            >
                                {date.getDate()}
                                {!isSelected && hasWorkout && (
                                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-success" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => { onSelectDate(null); onClose(); }}
                    className="w-full mt-6 py-3 rounded-xl bg-zinc-800 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                >
                    Clear Filter
                </button>
            </div>
        </Modal>
    );
};

export default CalendarModal;