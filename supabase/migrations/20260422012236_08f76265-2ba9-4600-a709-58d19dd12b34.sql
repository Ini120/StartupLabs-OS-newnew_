-- Enable realtime on tables the mentor dashboard subscribes to
ALTER TABLE public.mentor_assignments REPLICA IDENTITY FULL;
ALTER TABLE public."Startups" REPLICA IDENTITY FULL;
ALTER TABLE public."Milestones" REPLICA IDENTITY FULL;

-- Add to realtime publication (ignore if already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_assignments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."Startups";
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."Milestones";
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;