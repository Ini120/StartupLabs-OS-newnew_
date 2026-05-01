
-- Drop the overly permissive public SELECT policy on users table
DROP POLICY IF EXISTS "Anyone can read users" ON public.users;

-- Replace with a policy that blocks all direct reads (data is managed via edge functions with service role)
CREATE POLICY "No direct read access to users"
  ON public.users
  FOR SELECT
  USING (false);
