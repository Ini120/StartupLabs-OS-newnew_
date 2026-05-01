-- 1. Drop overly permissive UPDATE policy on profiles.
-- The service role bypasses RLS automatically, so this policy only ever
-- granted UPDATE access to the public/anon role, which is dangerous.
DROP POLICY IF EXISTS "Allow all updates via service role" ON public.profiles;

-- 2. Drop the SECURITY DEFINER view (flagged by Supabase linter).
-- It was unused and bypassed RLS of the querying user.
DROP VIEW IF EXISTS public.users_public;