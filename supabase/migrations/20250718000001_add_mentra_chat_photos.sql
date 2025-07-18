-- Create a table to store Mentra photos for chat integration
CREATE TABLE IF NOT EXISTS mentra_chat_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  audio_url TEXT,
  feedback TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'new',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE mentra_chat_photos ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own photos
CREATE POLICY "Users can view their own photos" 
  ON mentra_chat_photos 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow service role to insert photos (for webhook)
CREATE POLICY "Service role can insert photos" 
  ON mentra_chat_photos 
  FOR INSERT 
  WITH CHECK (true);

-- Add realtime support for the table
ALTER PUBLICATION supabase_realtime ADD TABLE mentra_chat_photos;
