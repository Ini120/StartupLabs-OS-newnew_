
CREATE TYPE public.app_role AS ENUM ('student', 'mentor', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);
