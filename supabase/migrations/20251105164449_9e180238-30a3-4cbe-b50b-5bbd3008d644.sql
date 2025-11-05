-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for event types
CREATE TYPE public.event_type AS ENUM (
  'auth_success',
  'project_created', 
  'upload_started',
  'upload_completed',
  'export_success'
);

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Only admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create analytics_events table
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name event_type NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  device TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert events (for tracking)
CREATE POLICY "Anyone can insert events"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Only admins can view all events
CREATE POLICY "Admins can view all events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Users can view their own events
CREATE POLICY "Users can view own events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_timestamp ON public.analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_events_device ON public.analytics_events(device);

-- Create a view for daily active users
CREATE OR REPLACE VIEW public.analytics_dau AS
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as dau
FROM public.analytics_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;