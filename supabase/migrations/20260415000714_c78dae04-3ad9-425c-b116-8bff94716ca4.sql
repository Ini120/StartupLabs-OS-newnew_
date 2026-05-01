
-- Mentor-student assignments with admin approval workflow
CREATE TABLE public.mentor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  mentor_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  assigned_by text DEFAULT 'system',
  admin_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE public.mentor_assignments ENABLE ROW LEVEL SECURITY;

-- Anyone can read assignments
CREATE POLICY "Anyone can read mentor assignments"
  ON public.mentor_assignments FOR SELECT
  USING (true);

-- Only service role can insert/update (via edge functions)
-- No direct insert/update/delete policies for regular users

-- Trigger for updated_at
CREATE TRIGGER update_mentor_assignments_updated_at
  BEFORE UPDATE ON public.mentor_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
