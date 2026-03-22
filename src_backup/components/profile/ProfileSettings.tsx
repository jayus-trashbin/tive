
import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Activity, Trash2, CheckCircle2, Save, AlertCircle, Palette, Database, Download, Upload } from 'lucide-react';
import { UserStats, ProfileFormData } from '../../types';
import { cn } from '../../lib/utils';
import { CloudSyncSection } from './CloudSyncSection';

interface Props {
    formData: ProfileFormData;
    setFormData: (data: ProfileFormData) => void;
    userStats: UserStats;
    onReset: () => void;
    onSave: () => void;
    statusMsg: { type: 'success' | 'error', text: string } | null;
}

import ExportDataButton from './ExportDataButton';

// ... existing imports

export const ProfileSettings: React.FC<Props> = ({
    formData, setFormData, userStats, onReset, onSave, statusMsg
}) => {
    return (
        <>
            <div className="flex-1 overflow-y-auto px-6 space-y-6 bg-gradient-to-b from-zinc-950/0 to-zinc-950/50 pb-4">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    {/* 1. Identity Section */}
                    <section className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 space-y-4">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2 uppercase tracking-wide opacity-80">
                            <User size={16} className="text-brand-primary" /> Identity
                        </h3>

                        <div className="grid gap-4">
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-brand-primary focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={16} />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-brand-primary focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </section>

                    {/* 2. Physical Profile */}
                    <section className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 space-y-4">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2 uppercase tracking-wide opacity-80">
                            <Activity size={16} className="text-brand-primary" /> Physical Profile
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Bodyweight (kg)</label>
                                <input
                                    type="number"
                                    value={formData.bodyweight}
                                    onChange={(e) => setFormData({ ...formData, bodyweight: Number(e.target.value) })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white font-mono focus:border-brand-primary focus:outline-none transition-colors text-center"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Gender</label>
                                <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                                    {(['male', 'female'] as const).map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setFormData({ ...formData, gender: g })}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all",
                                                formData.gender === g ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                            )}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Appearance */}
                    <section className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 space-y-4">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2 uppercase tracking-wide opacity-80">
                            <Palette size={16} className="text-brand-primary" /> Appearance
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Theme</label>
                                <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                                    {(['dark', 'oled', 'light'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setFormData({ ...formData, theme: t })}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all",
                                                formData.theme === t ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Unit System</label>
                                <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                                    {(['metric', 'imperial'] as const).map(u => (
                                        <button
                                            key={u}
                                            onClick={() => setFormData({ ...formData, unitSystem: u })}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all",
                                                formData.unitSystem === u ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                            )}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. AI Assistant */}
                    <section className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 space-y-4">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2 uppercase tracking-wide opacity-80">
                            <Activity size={16} className="text-brand-primary" /> AI Assistant
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Gemini API Key</label>
                                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-brand-primary hover:underline">
                                        Get Key
                                    </a>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        placeholder="AIzaSy..."
                                        value={formData.geminiApiKey || ''}
                                        onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-4 py-3 text-white text-sm font-mono focus:border-brand-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-600 mt-2 px-1">
                                    Required for AI routine generation. Your key is stored locally on your device.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 5. Cloud Sync (Supabase) */}
                    <CloudSyncSection formData={formData} setFormData={setFormData} userStats={userStats} />

                    {/* 5. Data Management */}
                    <section className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 space-y-4">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2 uppercase tracking-wide opacity-80">
                            <Database size={16} className="text-brand-primary" /> Data Management
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <ExportDataButton />
                            <button className="flex items-center justify-center gap-2 p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors">
                                <Upload size={16} />
                                <span className="text-xs font-bold">Import JSON</span>
                            </button>
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <div className="pt-4 border-t border-zinc-900">
                        <button
                            onClick={onReset}
                            className="w-full text-red-500/50 hover:text-red-500 text-xs font-bold py-3 flex items-center justify-center gap-2 transition-colors uppercase tracking-widest"
                        >
                            <Trash2 size={14} /> Reset Application Data
                        </button>
                    </div>
                </motion.div>

                {/* Safe Area Spacer */}
                <div className="h-safe-area-bottom" />
            </div>

            {/* Fixed Footer for Actions */}
            <div className="px-6 py-4 bg-zinc-950/90 backdrop-blur-md border-t border-white/5 shrink-0 pb-safe">
                <button
                    onClick={onSave}
                    className={cn(
                        "w-full text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]",
                        statusMsg?.type === 'success' ? "bg-brand-success text-white" :
                            statusMsg?.type === 'error' ? "bg-brand-danger text-white" :
                                "bg-white hover:bg-zinc-200"
                    )}
                >
                    {statusMsg ? (
                        <>
                            {statusMsg.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                            {statusMsg.text}
                        </>
                    ) : (
                        <>
                            <Save size={18} /> SAVE CHANGES
                        </>
                    )}
                </button>
            </div>
        </>
    );
};
