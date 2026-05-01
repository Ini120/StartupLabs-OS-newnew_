-- Drop the always-true INSERT policy on profiles. All profile writes
-- go through edge functions using the service role, which bypasses RLS.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;