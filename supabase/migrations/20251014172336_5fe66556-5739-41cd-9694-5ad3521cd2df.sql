-- Create table for keyframes
CREATE TABLE IF NOT EXISTS public.keyframes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL,
  timestamp DECIMAL NOT NULL,
  duration DECIMAL NOT NULL,
  image_url TEXT NOT NULL,
  transcription TEXT,
  shot_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_keyframes_video_id ON public.keyframes(video_id);
CREATE INDEX idx_keyframes_timestamp ON public.keyframes(timestamp);

-- Enable RLS
ALTER TABLE public.keyframes ENABLE ROW LEVEL SECURITY;

-- Allow public read access (adjust based on your needs)
CREATE POLICY "Anyone can view keyframes"
  ON public.keyframes
  FOR SELECT
  USING (true);

-- Allow public insert (adjust based on your needs)
CREATE POLICY "Anyone can insert keyframes"
  ON public.keyframes
  FOR INSERT
  WITH CHECK (true);

-- Create storage bucket for keyframe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('keyframes', 'keyframes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for keyframes
CREATE POLICY "Public can view keyframe images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'keyframes');

CREATE POLICY "Public can upload keyframe images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'keyframes');

CREATE POLICY "Public can update keyframe images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'keyframes');