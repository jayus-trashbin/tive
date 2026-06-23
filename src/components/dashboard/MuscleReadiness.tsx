import React, { useMemo } from 'react';
import { Battery, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import MuscleOverlay from '../progress/MuscleOverlay';
import { MuscleGroup } from '../../types/domain';

interface MuscleScore {
    muscle: string;
    score: number;
    label: string;
}

interface MuscleReadinessProps {
    readiness: MuscleScore[];
}

export const MuscleReadiness: React.FC<MuscleReadinessProps> = ({ readiness }) => {
    const getReadinessColor = (score: number) => {
        if (score > 0.8) return 'bg-brand-primary';
        if (score > 0.5) return 'bg-brand-warning';
        return 'bg-brand-danger';
    };

    const getReadinessText = (score: number) => {
        if (score > 0.8) return 'text-brand-primary';
        if (score > 0.5) return 'text-brand-warning';
        return 'text-brand-danger';
    };

    const activeMuscles = useMemo(() => readiness.map(r => r.muscle as MuscleGroup), [readiness]);
    const readinessScoresMap = useMemo(() => {
        const map = new Map<string, number>();
        readiness.forEach(r => map.set(r.muscle, r.score));
        return map;
    }, [readiness]);

    return (
        <section className="shrink-0 pb-6">
            <div className="section-title mb-4">
                <Battery size={16} className="text-brand-primary" /> Muscle Readiness
            </div>

            <div className="card p-5">
                {readiness.length > 0 ? (
                    <div className="flex flex-row items-center gap-6">
                        {/* Left: Anatomical Visual */}
                        <div className="flex-shrink-0">
                            <MuscleOverlay 
                                muscleGroups={activeMuscles}
                                readinessScores={readinessScoresMap}
                                size={120}
                                showToggle={true}
                            />
                        </div>

                        {/* Right: Detailed Bars */}
                        <div className="flex-1 space-y-4">
                            {readiness.slice(0, 6).map((item) => (
                                <div key={item.muscle} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-zinc-300 capitalize">{item.muscle}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("text-[9px] font-bold uppercase tracking-wider", getReadinessText(item.score))}>
                                                {item.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-700 ease-out", getReadinessColor(item.score))}
                                            style={{ width: `${item.score * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-500 py-6 gap-2">
                        <AlertCircle size={20} className="text-zinc-600 mb-2" />
                        <span className="text-sm font-medium">No Data Yet</span>
                        <span className="text-xs">Train to calibrate readiness</span>
                    </div>
                )}
            </div>
        </section>
    );
};
