-- Create table for storing user contact information
CREATE TABLE public.user_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_contacts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their contact info (lead capture)
CREATE POLICY "Anyone can submit contact info"
ON public.user_contacts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only allow reading for authenticated users (you can change this to admin-only later)
CREATE POLICY "Authenticated users can view contacts"
ON public.user_contacts
FOR SELECT
TO authenticated
USING (true);

-- Create index for email lookups
CREATE INDEX idx_user_contacts_email ON public.user_contacts(email);
CREATE INDEX idx_user_contacts_created_at ON public.user_contacts(created_at DESC);