-- Enable Row Level Security (RLS) on all tables
-- This ensures that users can only access their own data

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    subscription_tier TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    json_data JSONB NOT NULL, -- Stores the full session object
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- For soft deletes
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own sessions" ON public.sessions
    FOR ALL USING (auth.uid() = user_id);

-- 3. Routines Table
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    json_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own routines" ON public.routines
    FOR ALL USING (auth.uid() = user_id);

-- 4. Exercises Table
CREATE TABLE IF NOT EXISTS public.exercises (
    id TEXT PRIMARY KEY, -- Using TEXT as IDs might be custom strings or UUIDs
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    json_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own exercises" ON public.exercises
    FOR ALL USING (auth.uid() = user_id);

-- 5. Folders Table (for organizing routines)
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    json_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own folders" ON public.folders
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS routines_user_id_idx ON public.routines(user_id);
CREATE INDEX IF NOT EXISTS exercises_user_id_idx ON public.exercises(user_id);
CREATE INDEX IF NOT EXISTS folders_user_id_idx ON public.folders(user_id);
