
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Info, Copy, Globe, Key, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { UserStats, ProfileFormData } from '../../types';
import SyncStatus from '../ui/SyncStatus';

interface Props {
    formData: ProfileFormData;
    setFormData: (data: ProfileFormData) => void;
    userStats: UserStats;
}

const SQL_SETUP_QUERY = `-- Run this in your Supabase SQL Editor to enable Cloud Sync

-- 1. Create Tables (Document Store Pattern)
-- We use TEXT for IDs to support both UUIDs and API-based string IDs.
-- 'json_data' stores the full entity including 'deletedAt' for soft deletes.

create table if not exists sessions (
  id text primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  json_data jsonb not null
);

create table if not exists routines (
  id text primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  json_data jsonb not null
);

create table if not exists exercises (
  id text primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  json_data jsonb not null
);

-- 2. Performance Indices
-- Accelerate sync operations and future server-side filtering
create index if not exists sessions_updated_idx on sessions (updated_at);
create index if not exists routines_updated_idx on routines (updated_at);
create index if not exists exercises_updated_idx on exercises (updated_at);

-- 3. Enable Row Level Security (RLS)
alter table sessions enable row level security;
alter table routines enable row level security;
alter table exercises enable row level security;

-- 4. Access Policies (Personal Mode)
-- Since this is a personal instance using your own API Key, 
-- we allow full access to the public/anon role.
create policy "Allow Access Sessions" on sessions for all using (true) with check (true);
create policy "Allow Access Routines" on routines for all using (true) with check (true);
create policy "Allow Access Exercises" on exercises for all using (true) with check (true);
`;

export const CloudSyncSection: React.FC<Props> = ({ formData, setFormData, userStats }) => {
    const [showSqlHelp, setShowSqlHelp] = useState(false);
    const [showKey, setShowKey] = useState(false);

    const handleCopySql = () => {
        navigator.clipboard.writeText(SQL_SETUP_QUERY);
        alert("SQL copied to clipboard!");
    };

    return (
        <section className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Database size={100} />
            </div>
            <div className="flex justify-between items-center relative z-10">
                <h3 className="text-white font-bold text-sm flex items-center gap-2 uppercase tracking-wide opacity-80">
                    <Database size={16} className="text-brand-primary" /> Cloud Sync
                </h3>
                <button
                    onClick={() => setShowSqlHelp(!showSqlHelp)}
                    className="text-xs font-bold text-brand-primary flex items-center gap-1 hover:underline"
                >
                    <Info size={14} /> Setup Guide
                </button>
            </div>

            {/* SQL HELP ACCORDION */}
            <AnimatePresence>
                {showSqlHelp && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-black/50 rounded-xl border border-brand-primary/20 relative z-10"
                    >
                        <div className="p-4 space-y-3">
                            <p className="text-[10px] text-zinc-400">
                                To sync data, create a free project at <span className="text-white">supabase.com</span>.
                                Go to the <strong className="text-white">SQL Editor</strong> and run this query to set up your tables:
                            </p>
                            <div className="bg-zinc-950 p-3 rounded-lg border border-white/10 relative group">
                                <pre className="text-[9px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                                    {SQL_SETUP_QUERY}
                                </pre>
                                <button
                                    onClick={handleCopySql}
                                    className="absolute top-2 right-2 p-1.5 bg-zinc-800 rounded-md text-zinc-400 hover:text-white"
                                >
                                    <Copy size={12} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3 relative z-10">
                <div className="relative group">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-primary transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Supabase Project URL"
                        value={formData.supabaseUrl}
                        onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white text-xs font-mono focus:border-brand-primary focus:outline-none transition-colors"
                    />
                </div>
                <div className="relative group">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-primary transition-colors" size={16} />
                    <input
                        type={showKey ? "text" : "password"}
                        placeholder="Supabase Anon Key"
                        value={formData.supabaseKey}
                        onChange={(e) => setFormData({ ...formData, supabaseKey: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-white text-xs font-mono focus:border-brand-primary focus:outline-none transition-colors"
                    />
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
                    >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>
            <div className="flex justify-between items-center relative z-10 pt-2">
                <SyncStatus />
            </div>
        </section>
    );
};
