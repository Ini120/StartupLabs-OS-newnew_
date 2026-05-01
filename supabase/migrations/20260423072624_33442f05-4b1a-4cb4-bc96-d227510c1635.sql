-- ============================================================
-- 1. Add super_admin role
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'super_admin'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'super_admin';
  END IF;
END $$;

-- ============================================================
-- 2. Admin invites table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_by text NOT NULL,
  used_by text,
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_invites_token ON public.admin_invites(token);
CREATE INDEX IF NOT EXISTS idx_admin_invites_email ON public.admin_invites(email);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can read an unused, unexpired invite by token (signup flow validates the link)
DROP POLICY IF EXISTS "Anyone can read valid admin invites" ON public.admin_invites;
CREATE POLICY "Anyone can read valid admin invites"
  ON public.admin_invites FOR SELECT
  USING (used_at IS NULL AND expires_at > now());

-- Writes go through edge functions using service role; no client write policies needed.

-- ============================================================
-- 3. Showcase posts (status updates / photos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.showcase_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  content text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  startup_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_showcase_posts_created_at ON public.showcase_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_showcase_posts_user_id ON public.showcase_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_showcase_posts_startup_id ON public.showcase_posts(startup_id);

ALTER TABLE public.showcase_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read posts" ON public.showcase_posts;
CREATE POLICY "Anyone can read posts"
  ON public.showcase_posts FOR SELECT USING (true);

-- Writes are managed by an edge function (Clerk-authenticated). No client write policies.

-- ============================================================
-- 4. Post likes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.showcase_posts(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read post likes" ON public.post_likes;
CREATE POLICY "Anyone can read post likes"
  ON public.post_likes FOR SELECT USING (true);

-- ============================================================
-- 5. Startup likes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.startup_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL,
  user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (startup_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_startup_likes_startup_id ON public.startup_likes(startup_id);

ALTER TABLE public.startup_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read startup likes" ON public.startup_likes;
CREATE POLICY "Anyone can read startup likes"
  ON public.startup_likes FOR SELECT USING (true);

-- ============================================================
-- 6. Comments (on posts OR startups)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.showcase_posts(id) ON DELETE CASCADE,
  startup_id uuid,
  user_id text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (post_id IS NOT NULL AND startup_id IS NULL)
    OR (post_id IS NULL AND startup_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_startup_id ON public.post_comments(startup_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON public.post_comments(created_at DESC);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comments" ON public.post_comments;
CREATE POLICY "Anyone can read comments"
  ON public.post_comments FOR SELECT USING (true);

-- ============================================================
-- 7. Realtime
-- ============================================================
ALTER TABLE public.showcase_posts REPLICA IDENTITY FULL;
ALTER TABLE public.post_likes REPLICA IDENTITY FULL;
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;
ALTER TABLE public.startup_likes REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.showcase_posts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.startup_likes; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;