import React, { useState, useEffect } from 'react';
import { generateInsights, AIInsight, InsightsResponse } from '../../services/AIService';
import { Sparkles, BrainCircuit, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';

export const InsightsPanel: React.FC = () => {
    const [insightsData, setInsightsData] = useState<InsightsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const history = useWorkoutStore(s => s.history);
    
    useEffect(() => {
        let mounted = true;
        const loadInsights = async () => {
            setLoading(true);
            const data = await generateInsights();
            if (mounted) {
                setInsightsData(data);
                setLoading(false);
            }
        };
        loadInsights();
        return () => { mounted = false; };
    }, [history]);
    
    if (loading) {
        return (
            <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 animate-pulse flex items-center justify-center h-32">
                <div className="flex items-center space-x-2 text-white/50">
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>Analisando padrões...</span>
                </div>
            </div>
        );
    }
    
    if (!insightsData || insightsData.insights.length === 0) return null;
    
    const getIcon = (type: string) => {
        switch(type) {
            case 'success': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
            default: return <Info className="w-5 h-5 text-blue-400" />;
        }
    };
    
    return (
        <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                    <span>Insights de Treino</span>
                </h3>
                <div className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-white/50 flex items-center space-x-1">
                    {insightsData.source === 'ai' ? (
                        <><Sparkles className="w-3 h-3 text-indigo-400"/> <span>Gemini AI</span></>
                    ) : (
                        <span>Local</span>
                    )}
                </div>
            </div>
            
            <div className="space-y-3">
                {insightsData.insights.map((insight, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border border-white/5 bg-black/20 flex space-x-3 items-start ${
                        insight.type === 'warning' ? "border-amber-500/20 bg-amber-500/5" :
                        insight.type === 'success' ? "border-emerald-500/20 bg-emerald-500/5" : ""
                    }`}>
                        <div className="mt-0.5 shrink-0">
                            {getIcon(insight.type)}
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-white">{insight.title}</h4>
                            <p className="text-sm text-white/70 mt-0.5">{insight.description}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            {insightsData.message && (
                <div className="mt-3 text-xs text-white/40 italic">
                    {insightsData.message}
                </div>
            )}
        </div>
    );
};
