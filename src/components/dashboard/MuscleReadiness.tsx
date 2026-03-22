import React from 'react';
import { Battery, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

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

    return (
        <section className="shrink-0 pb-6">
            <div className="section-title mb-4">
                <Battery size={12} className="text-brand-primary" /> Muscle Readiness
            </div>

            <div className="card-elevated p-4 space-y-5 border-t-2 border-brand-primary/20">
                {readiness.length > 0 ? (
                    readiness.slice(0, 6).map((item) => (
                        <div key={item.muscle} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="data-label text-zinc-400">{item.muscle}</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-[10px] font-mono font-bold", getReadinessText(item.score))}>
                                        {Math.round(item.score * 100)}%
                                    </span>
                                    <span className={cn("data-label", getReadinessText(item.score))}>
                                        {item.label}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-0.5 h-2">
                                {[...Array(10)].map((_, i) => {
                                    const isActive = (item.score * 10) > i;
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "flex-1 h-full transition-colors duration-500",
                                                isActive ? getReadinessColor(item.score) : "bg-zinc-800/40"
                                            )}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center gap-3 text-zinc-500 data-label py-6 justify-center">
                        <AlertCircle size={14} />
                        Train to calibrate readiness
                    </div>
                )}
            </div>
        </section>
    );
};
