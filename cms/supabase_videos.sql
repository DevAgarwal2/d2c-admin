-- Videos table for showcasing craftsmanship videos
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY DEFAULT 'video_' || gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed)
CREATE POLICY "Allow all operations on videos" ON videos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_videos_display_order ON videos(display_order);
CREATE INDEX IF NOT EXISTS idx_videos_is_active ON videos(is_active);

-- Sample seed data (optional - delete these if you don't want sample videos)
INSERT INTO videos (title, description, video_url, thumbnail_url, display_order, is_active) VALUES
(
  'Traditional Brass Casting Process', 
  'Watch our master artisans create beautiful brass vessels using centuries-old techniques passed down through generations.',
  'https://www.youtube.com/watch?v=sample1',
  'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600',
  1,
  true
),
(
  'Handcrafting Antique Boxes', 
  'See the intricate detailing and craftsmanship that goes into each of our antique brass boxes.',
  'https://www.youtube.com/watch?v=sample2',
  'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600',
  2,
  true
),
(
  'The Art of Dhoopdani Making', 
  'Discover how we create elegant dhoopdani pieces that add spiritual elegance to your home.',
  'https://www.youtube.com/watch?v=sample3',
  'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=600',
  3,
  true
)
ON CONFLICT (id) DO NOTHING;
