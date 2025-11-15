-- Fix contact form data exposure - restrict to admins only
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON user_contacts;

CREATE POLICY "Only admins can view contacts" ON user_contacts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));