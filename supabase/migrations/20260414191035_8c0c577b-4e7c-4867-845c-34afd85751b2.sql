
-- Recreate view without security_invoker so it bypasses RLS on the base table
-- This is safe because the view only exposes id and name (no emails or sensitive data)
DROP VIEW IF EXISTS public.users_public;

CREATE VIEW public.users_public AS
  SELECT id, name
  FROM public.users;

GRANT SELECT ON public.users_public TO anon, authenticated;
