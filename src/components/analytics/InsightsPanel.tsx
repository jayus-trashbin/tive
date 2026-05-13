import React, { useState, useEffect } from 'react';
import { generateInsights, AIInsight, InsightsResponse } from '../../services/AIService';
import { Sparkles, BrainCircuit, AlertTriangle, TrendingUp, Info, ChevronRight } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { SkeletonBlock } from '../ui/SkeletonBlock';

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
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <BrainCircuit size={14} className="text-brand-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Analysing Patterns...</span>
                </div>
                <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 space-y-3">
                    <SkeletonBlock height="24px" width="40%" />
                    <SkeletonBlock height="60px" />
                    <SkeletonBlock height="60px" />
                </div>
            </div>
        );
    }
    
    if (!insightsData || insightsData.insights.length === 0) return null;
    
    const getIcon = (type: string) => {
        switch(type) {
            case 'success': return <TrendingUp className="w-5 h-5 text-brand-success" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-brand-warning" />;
            default: return <Info className="w-5 h-5 text-brand-primary" />;
        }
    };
    
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                    <BrainCircuit size={14} className="text-brand-primary" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Coaching Insights
                    </h3>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800">
                    {insightsData.source === 'ai' ? (
                        <>
                            <Sparkles className="w-3 h-3 text-brand-primary animate-pulse" />
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Gemini Intelligence</span>
                        </>
                    ) : (
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">Local Engine</span>
                    )}
                </div>
            </div>
            
            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md relative overflow-hidden group"
            >
                {/* Subtle Background Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-primary/10 transition-colors duration-700" />

                <div className="space-y-4 relative z-10">
                    {insightsData.insights.map((insight, idx) => (
                        <motion.div 
                            key={idx} 
                            variants={item}
                            className={cn(
                                "p-4 rounded-2xl border border-white/5 flex space-x-4 items-start transition-all hover:bg-white/5",
                                insight.type === 'warning' ? "bg-brand-warning/5 border-brand-warning/10" :
                                insight.type === 'success' ? "bg-brand-success/5 border-brand-success/10" : "bg-black/20"
                            )}
                        >
                            <div className="mt-1 shrink-0 p-2 bg-zinc-950 rounded-xl border border-white/5">
                                {getIcon(insight.type)}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-bold text-white uppercase tracking-tight flex items-center justify-between">
                                    {insight.title}
                                    <ChevronRight size={12} className="text-zinc-700" />
                                </h4>
                                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{insight.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
                
                {insightsData.message && insightsData.source === 'local' && (
                    <div className="mt-4 pt-4 border-t border-white/5 text-[9px] text-zinc-600 italic flex items-center gap-1.5 px-1">
                        <Info size={10} />
                        Configure Gemini API key in settings for deeper AI-driven analysis.
                    </div>
                )}
            </motion.div>
        </div>
    );
};

