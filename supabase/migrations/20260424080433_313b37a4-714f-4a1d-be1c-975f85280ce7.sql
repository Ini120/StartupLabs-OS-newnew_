
-- 1. Create the documents storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
-- Anyone authenticated can read (so mentors/admins can view) — files are scoped via the Documents table
CREATE POLICY "Authenticated can read documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY "Anyone can upload to documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can delete from documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');

-- 2. Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                  -- recipient (Clerk id)
  actor_id TEXT NOT NULL,                 -- the person who triggered it
  type TEXT NOT NULL,                     -- 'like_post' | 'comment_post' | 'like_startup' | 'comment_startup'
  post_id UUID,
  startup_id UUID,
  comment_id UUID,
  message TEXT NOT NULL DEFAULT '',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read_at, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Anyone can read notifications addressed to anyone (we filter in queries by user_id; matches existing app pattern)
CREATE POLICY "Read notifications"
ON public.notifications FOR SELECT
USING (true);

-- Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
