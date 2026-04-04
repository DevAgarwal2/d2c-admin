-- Feedback table for customer reviews
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY DEFAULT 'feedback_' || gen_random_uuid()::text,
  customer_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add location column if table already exists (for migrations)
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS location TEXT;

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed)
CREATE POLICY "Allow all operations on feedback" ON feedback
  FOR ALL
  USING (true)
  WITH CHECK (true);
