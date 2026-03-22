import { Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

// Define the missing type locally since it's an isolated component
export interface ConsistencyAtom {
    streakDays: number;
    missedSessionRate: number;
    problematicDay?: number;
}

interface ConsistencyCardProps {
    data: ConsistencyAtom;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ConsistencyCard: React.FC<ConsistencyCardProps> = ({ data }) => {
    const isProblematic = data.missedSessionRate > 0.5;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-semibold text-zinc-100">Schedule Consistency</h3>
                </div>
                <div className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-lg">
                    <span className="text-xs text-zinc-400">Streak</span>
                    <span className="text-sm font-bold text-white">🔥 {data.streakDays}</span>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm text-zinc-500">Miss Rate</span>
                    <span className={`text-2xl font-bold ${isProblematic ? 'text-red-400' : 'text-emerald-400'}`}>
                        {(data.missedSessionRate * 100).toFixed(0)}%
                    </span>
                </div>

                {data.problematicDay !== undefined && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-red-300 uppercase tracking-wider">Conflict Detected</span>
                            <span className="text-sm font-semibold text-red-200">
                                {DAYS[data.problematicDay] || 'Day'}s are tricky
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${isProblematic ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-500`}
                    style={{ width: `${Math.max(5, (1 - data.missedSessionRate) * 100)}%` }}
                />
            </div>

            <p className="text-xs text-zinc-500 italic">
                {isProblematic
                    ? "Tip: Consistency beats intensity. Consider moving this session."
                    : "Great work! Your schedule compliance is solid."}
            </p>
        </div>
    );
};
