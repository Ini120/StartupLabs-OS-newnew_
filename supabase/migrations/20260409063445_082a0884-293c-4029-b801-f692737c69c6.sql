
-- Drop foreign key constraints that reference auth-managed tables
ALTER TABLE "Startups" DROP CONSTRAINT IF EXISTS "Startups_student_id_fkey";
ALTER TABLE "Documents" DROP CONSTRAINT IF EXISTS "Documents_startup_id_fkey";
ALTER TABLE "Milestones" DROP CONSTRAINT IF EXISTS "Milestones_startup_id_fkey";
ALTER TABLE "MentorshipRecords" DROP CONSTRAINT IF EXISTS "MentorshipRecords_mentor_id_fkey";
ALTER TABLE "MentorshipRecords" DROP CONSTRAINT IF EXISTS "MentorshipRecords_student_id_fkey";
ALTER TABLE "MentorshipRecords" DROP CONSTRAINT IF EXISTS "MentorshipRecords_startup_id_fkey";
ALTER TABLE "ActivityLogs" DROP CONSTRAINT IF EXISTS "ActivityLogs_user_id_fkey";

-- Change student_id in Startups from uuid to text for Clerk IDs
ALTER TABLE "Startups" ALTER COLUMN student_id TYPE text USING student_id::text;

-- Change user ID columns in other tables to text
ALTER TABLE "MentorshipRecords" ALTER COLUMN mentor_id TYPE text USING mentor_id::text;
ALTER TABLE "MentorshipRecords" ALTER COLUMN student_id TYPE text USING student_id::text;
ALTER TABLE "ActivityLogs" ALTER COLUMN user_id TYPE text USING user_id::text;

-- Add missing columns
ALTER TABLE "Startups" ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'idea';
ALTER TABLE "Documents" ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE "Documents" ADD COLUMN IF NOT EXISTS uploaded_by text;

-- Add RLS policies for reading data (open select, writes via edge functions)
CREATE POLICY "Anyone can read startups" ON "Startups" FOR SELECT USING (true);
CREATE POLICY "Anyone can read milestones" ON "Milestones" FOR SELECT USING (true);
CREATE POLICY "Anyone can read documents" ON "Documents" FOR SELECT USING (true);
CREATE POLICY "Anyone can read mentorship records" ON "MentorshipRecords" FOR SELECT USING (true);
CREATE POLICY "Anyone can read activity logs" ON "ActivityLogs" FOR SELECT USING (true);
CREATE POLICY "Anyone can read users" ON "users" FOR SELECT USING (true);
