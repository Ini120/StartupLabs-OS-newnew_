export type UserRole = 'student' | 'mentor' | 'admin' | 'super_admin';

export type StartupStage = 'idea' | 'validation' | 'mvp' | 'growth';

export type MilestoneStatus = 'pending' | 'in-progress' | 'completed';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  role: UserRole;
}

export interface Startup {
  id: string;
  name: string;
  description: string;
  stage: StartupStage;
  logo_url?: string;
  created_by: string;
  created_at: string;
  members: StartupMember[];
}

export interface StartupMember {
  id: string;
  user_id: string;
  startup_id: string;
  role: 'founder' | 'member';
  user?: UserProfile;
}

export interface Milestone {
  id: string;
  startup_id: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  due_date?: string;
  completed_at?: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  milestone_id: string;
  title: string;
  status: TaskStatus;
  assignee_id?: string;
  due_date?: string;
}

export interface Document {
  id: string;
  startup_id: string;
  name: string;
  file_url: string;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface MentorshipRecord {
  id: string;
  mentor_id: string;
  startup_id: string;
  session_date: string;
  notes: string;
  feedback?: string;
  startup?: Startup;
  mentor?: UserProfile;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  user?: UserProfile;
}
