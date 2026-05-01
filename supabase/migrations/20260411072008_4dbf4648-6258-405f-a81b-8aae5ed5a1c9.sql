
-- Drop the overly permissive public SELECT policy on ActivityLogs
DROP POLICY IF EXISTS "Anyone can read activity logs" ON public."ActivityLogs";

-- Users can only read their own activity logs
CREATE POLICY "Users can read own activity logs"
  ON public."ActivityLogs"
  FOR SELECT
  USING (auth.uid()::text = user_id);
