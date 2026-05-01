-- ============================================
-- 1. EXTEND profiles
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location text DEFAULT '',
  ADD COLUMN IF NOT EXISTS headline text DEFAULT '',
  ADD COLUMN IF NOT EXISTS github_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS linkedin_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS twitter_url text DEFAULT '';

-- ============================================
-- 2. user_projects
-- ============================================
CREATE TABLE public.user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  role text DEFAULT '',
  stage text DEFAULT '',
  cover_url text DEFAULT '',
  link_url text DEFAULT '',
  started_at date,
  ended_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_projects_user ON public.user_projects(user_id);

-- ============================================
-- 3. user_skills
-- ============================================
CREATE TABLE public.user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
CREATE INDEX idx_user_skills_user ON public.user_skills(user_id);

-- ============================================
-- 4. user_achievements
-- ============================================
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'trophy',
  earned_at date DEFAULT (now()::date),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

-- ============================================
-- 5. follows (request + approve)
-- ============================================
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id text NOT NULL,
  following_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);
CREATE INDEX idx_follows_status ON public.follows(status);

-- ============================================
-- 6. activity_feed
-- ============================================
CREATE TABLE public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  type text NOT NULL,        -- 'project_added' | 'achievement_earned' | 'milestone_completed' | 'post' | 'startup_joined'
  title text NOT NULL,
  description text DEFAULT '',
  ref_id text,               -- optional id of related entity
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_user ON public.activity_feed(user_id, created_at DESC);

-- ============================================
-- TRIGGERS for updated_at
-- ============================================
CREATE TRIGGER trg_user_projects_updated
BEFORE UPDATE ON public.user_projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read user projects" ON public.user_projects FOR SELECT USING (true);
CREATE POLICY "Read user skills" ON public.user_skills FOR SELECT USING (true);
CREATE POLICY "Read user achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Read follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Read activity" ON public.activity_feed FOR SELECT USING (true);

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER TABLE public.follows REPLICA IDENTITY FULL;
ALTER TABLE public.activity_feed REPLICA IDENTITY FULL;
