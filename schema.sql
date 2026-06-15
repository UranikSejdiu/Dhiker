-- Run this in your Supabase SQL Editor

-- 1. Create the dhikrs table
CREATE TABLE public.dhikrs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    name text NOT NULL,
    total_count integer DEFAULT 0 NOT NULL,
    daily_count integer DEFAULT 0 NOT NULL,
    daily_limit integer,
    last_reset_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.dhikrs ENABLE ROW LEVEL SECURITY;

-- 3. Create policies so users can only access their own data
CREATE POLICY "Users can view their own dhikrs" 
ON public.dhikrs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dhikrs" 
ON public.dhikrs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dhikrs" 
ON public.dhikrs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dhikrs" 
ON public.dhikrs FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Enable Realtime on the dhikrs table
alter publication supabase_realtime add table public.dhikrs;
