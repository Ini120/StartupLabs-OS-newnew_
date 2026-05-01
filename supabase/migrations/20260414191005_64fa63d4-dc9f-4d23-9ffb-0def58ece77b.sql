
-- Create a public view exposing only id and name from users table
-- This allows the showcase to display founder names without exposing emails
CREATE VIEW public.users_public
WITH (security_invoker = on) AS
  SELECT id, name
  FROM public.users;

-- Grant select on the view to anon and authenticated roles
GRANT SELECT ON public.users_public TO anon, authenticated;
