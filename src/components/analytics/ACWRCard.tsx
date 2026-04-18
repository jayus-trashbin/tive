import React from 'react';
import { cn } from '../../lib/utils';
import { Activity, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';

interface Props {
    ratio: number;
    acute: number;
    chronic: number;
    risk: 'low' | 'optimal' | 'high';
    compact?: boolean;
}

const RISK_CONFIG = {
    low: {
        label: 'Under-trained',
        sublabel: 'Increase load gradually',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        Icon: TrendingDown,
        barColor: 'bg-blue-400',
    },
    optimal: {
        label: 'Optimal Load',
        sublabel: 'Keep this intensity',
        color: 'text-brand-success',
        bg: 'bg-brand-success/10',
        border: 'border-brand-success/20',
        Icon: CheckCircle2,
        barColor: 'bg-brand-primary',
    },
    high: {
        label: 'High Risk',
        sublabel: 'Consider a deload',
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        Icon: AlertTriangle,
        barColor: 'bg-red-400',
    },
};

/**
 * A-02 — ACWR (Acute:Chronic Workload Ratio) indicator.
 * Ratio <0.8 = low/undertrained, 0.8–1.3 = optimal, >1.3 = high injury risk.
 * Can be shown compact (for dashboard) or full (for WorkoutSummary).
 */
const ACWRCard: React.FC<Props> = ({ ratio, acute, chronic, risk, compact = false }) => {
    const cfg = RISK_CONFIG[risk];
    const Icon = cfg.Icon;

    // Bar represents the ratio capped at 2.0
    const barPct = Math.min((ratio / 2) * 100, 100);

    if (compact) {
        return (
            <div className={cn('flex items-center gap-2 px-3 py-2 rounded-[4px] border', cfg.bg, cfg.border)}>
                <Activity size={12} className={cfg.color} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1">
                        <span className={cn('text-sm font-black font-mono leading-none', cfg.color)}>
                            {ratio.toFixed(2)}
                        </span>
                        <span className="text-[8px] text-zinc-600 font-mono">ACWR</span>
                    </div>
                    <span className={cn('text-[8px] font-bold uppercase tracking-wider', cfg.color)}>
                        {cfg.label}
                    </span>
                </div>
                <Icon size={14} className={cn(cfg.color, 'shrink-0')} />
            </div>
        );
    }

    return (
        <div className={cn('rounded-[4px] border p-4', cfg.bg, cfg.border)}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Activity size={14} className={cfg.color} />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">
                        Workload Ratio (ACWR)
                    </span>
                </div>
                <Icon size={16} className={cfg.color} />
            </div>

            {/* Ratio display */}
            <div className="flex items-baseline gap-2 mb-3">
                <span className={cn('text-3xl font-black font-mono leading-none', cfg.color)}>
                    {ratio.toFixed(2)}
                </span>
                <div>
                    <div className={cn('text-xs font-bold', cfg.color)}>{cfg.label}</div>
                    <div className="text-[9px] text-zinc-600">{cfg.sublabel}</div>
                </div>
            </div>

            {/* Visual bar: zones */}
            <div className="relative mb-2">
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="bg-blue-400/40 flex-[0.8]" />
                    <div className="bg-brand-primary/40 flex-[0.5]" />
                    <div className="bg-red-400/40 flex-[0.7]" />
                </div>
                {/* Needle */}
                <div
                    className={cn('absolute top-0 w-1 h-2 rounded-full', cfg.barColor, 'transition-all duration-700')}
                    style={{ left: `calc(${barPct}% - 2px)` }}
                />
            </div>
            <div className="flex justify-between text-[8px] text-zinc-700 font-mono mb-3">
                <span>0.0 Low</span>
                <span>0.8–1.3 Optimal</span>
                <span>High 2.0</span>
            </div>

            {/* Acute / Chronic breakdown */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-900/80 rounded-[3px] p-2">
                    <div className="text-[8px] text-zinc-600 font-mono uppercase mb-0.5">Acute (7d)</div>
                    <div className="text-sm font-black font-mono text-white">{acute.toFixed(0)}</div>
                </div>
                <div className="bg-zinc-900/80 rounded-[3px] p-2">
                    <div className="text-[8px] text-zinc-600 font-mono uppercase mb-0.5">Chronic (28d)</div>
                    <div className="text-sm font-black font-mono text-white">{chronic.toFixed(0)}</div>
                </div>
            </div>
        </div>
    );
};

export default ACWRCard;
