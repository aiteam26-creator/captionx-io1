-- Drop the existing view with SECURITY DEFINER
DROP VIEW IF EXISTS public.analytics_dau;

-- Recreate the view without SECURITY DEFINER (uses SECURITY INVOKER by default)
CREATE VIEW public.analytics_dau 
WITH (security_invoker = true)
AS
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as dau
FROM public.analytics_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;