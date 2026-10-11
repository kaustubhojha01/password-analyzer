-- ============================================================================
-- CYBER PASSWORD ANALYZER - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Run this SQL in your Supabase Project:
-- Dashboard -> SQL Editor -> New Query -> Paste and Click "Run"
-- ============================================================================

-- 1. Create the analysis_history table
CREATE TABLE IF NOT EXISTS analysis_history (
    id TEXT PRIMARY KEY,
    masked_password TEXT NOT NULL,
    score INTEGER NOT NULL,
    score_label TEXT NOT NULL,
    crack_time TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index on date for fast sorted queries
CREATE INDEX IF NOT EXISTS idx_analysis_history_date ON analysis_history (date DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- 4. Set RLS Policies for Anon / Authenticated Users

-- Allow reading history
CREATE POLICY "Allow public read access"
ON analysis_history FOR SELECT
TO anon, authenticated
USING (true);

-- Allow inserting new evaluations
CREATE POLICY "Allow public insert access"
ON analysis_history FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow clearing history
CREATE POLICY "Allow public delete access"
ON analysis_history FOR DELETE
TO anon, authenticated
USING (true);
