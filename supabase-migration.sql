-- Migration script for Evo2 Pathogenicity Analysis
-- Run this in your Supabase SQL Editor

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  genome_assembly TEXT NOT NULL DEFAULT 'hg38',
  selected_gene JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  chromosome TEXT NOT NULL,
  reference TEXT NOT NULL,
  alternative TEXT NOT NULL,
  delta_score DOUBLE PRECISION NOT NULL,
  prediction TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  gene_symbol TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_session_id ON predictions(session_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
-- For now, allow all operations - you can restrict this later based on user authentication
CREATE POLICY "Allow all operations on sessions" ON sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on predictions" ON predictions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- If you want to restrict to authenticated users only, use:
-- CREATE POLICY "Users can view own sessions" ON sessions
--   FOR SELECT
--   USING (auth.uid() = user_id OR user_id IS NULL);
--
-- CREATE POLICY "Users can create own sessions" ON sessions
--   FOR INSERT
--   WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
--
-- CREATE POLICY "Users can update own sessions" ON sessions
--   FOR UPDATE
--   USING (auth.uid() = user_id OR user_id IS NULL);
--
-- CREATE POLICY "Users can delete own sessions" ON sessions
--   FOR DELETE
--   USING (auth.uid() = user_id OR user_id IS NULL);

