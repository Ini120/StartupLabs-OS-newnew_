import { UserProfile, Startup, Milestone, Task, Document, MentorshipRecord, ActivityLog } from '@/types';

export const mockUsers: UserProfile[] = [
  { id: '1', email: 'alice@school.edu', full_name: 'Alice Johnson', role: 'student', bio: 'Aspiring entrepreneur passionate about EdTech' },
  { id: '2', email: 'bob@school.edu', full_name: 'Bob Smith', role: 'student', bio: 'Building the future of sustainable packaging' },
  { id: '3', email: 'carol@school.edu', full_name: 'Dr. Carol Williams', role: 'mentor', bio: 'Serial entrepreneur, 15 years in SaaS' },
  { id: '4', email: 'dave@school.edu', full_name: 'Dave Chen', role: 'mentor', bio: 'VC partner specializing in early-stage startups' },
  { id: '5', email: 'admin@school.edu', full_name: 'Eva Martinez', role: 'admin', bio: 'Lab Director' },
];

export const mockStartups: Startup[] = [
  {
    id: 's1', name: 'EduFlow', description: 'AI-powered learning platform that adapts to student pace and style.',
    stage: 'mvp', logo_url: '', created_by: '1', created_at: '2025-09-01',
    members: [{ id: 'm1', user_id: '1', startup_id: 's1', role: 'founder' }],
  },
  {
    id: 's2', name: 'GreenPack', description: 'Biodegradable packaging solutions for e-commerce businesses.',
    stage: 'validation', logo_url: '', created_by: '2', created_at: '2025-10-15',
    members: [{ id: 'm2', user_id: '2', startup_id: 's2', role: 'founder' }],
  },
  {
    id: 's3', name: 'MedTrack', description: 'Medication reminder and health tracking for elderly care.',
    stage: 'idea', logo_url: '', created_by: '1', created_at: '2026-01-10',
    members: [{ id: 'm3', user_id: '1', startup_id: 's3', role: 'founder' }],
  },
  {
    id: 's4', name: 'FarmLink', description: 'Connecting local farmers directly with urban consumers.',
    stage: 'growth', logo_url: '', created_by: '2', created_at: '2025-06-20',
    members: [{ id: 'm4', user_id: '2', startup_id: 's4', role: 'founder' }],
  },
];

export const mockMilestones: Milestone[] = [
  { id: 'ml1', startup_id: 's1', title: 'Complete MVP', status: 'completed', description: 'Build core features', due_date: '2026-01-15', completed_at: '2026-01-12' },
  { id: 'ml2', startup_id: 's1', title: 'User Testing', status: 'in-progress', description: 'Run 20 user tests', due_date: '2026-03-01' },
  { id: 'ml3', startup_id: 's1', title: 'Launch Beta', status: 'pending', description: 'Public beta release', due_date: '2026-04-15' },
  { id: 'ml4', startup_id: 's2', title: 'Market Research', status: 'completed', description: 'Validate market demand', due_date: '2026-01-30', completed_at: '2026-01-28' },
  { id: 'ml5', startup_id: 's2', title: 'Prototype Design', status: 'in-progress', description: 'Create first packaging prototype', due_date: '2026-03-15' },
];

export const mockTasks: Task[] = [
  { id: 't1', milestone_id: 'ml2', title: 'Recruit test participants', status: 'done', assignee_id: '1', due_date: '2026-02-10' },
  { id: 't2', milestone_id: 'ml2', title: 'Create testing script', status: 'in-progress', assignee_id: '1', due_date: '2026-02-20' },
  { id: 't3', milestone_id: 'ml2', title: 'Analyze results', status: 'todo', assignee_id: '1', due_date: '2026-03-01' },
  { id: 't4', milestone_id: 'ml5', title: 'Source biodegradable materials', status: 'in-progress', assignee_id: '2', due_date: '2026-02-28' },
  { id: 't5', milestone_id: 'ml5', title: '3D print prototype', status: 'todo', assignee_id: '2', due_date: '2026-03-10' },
];

export const mockDocuments: Document[] = [
  { id: 'd1', startup_id: 's1', name: 'EduFlow Pitch Deck.pdf', file_url: '#', file_type: 'application/pdf', uploaded_by: '1', uploaded_at: '2025-12-01' },
  { id: 'd2', startup_id: 's1', name: 'Market Analysis.docx', file_url: '#', file_type: 'application/docx', uploaded_by: '1', uploaded_at: '2026-01-05' },
  { id: 'd3', startup_id: 's2', name: 'GreenPack Business Plan.pdf', file_url: '#', file_type: 'application/pdf', uploaded_by: '2', uploaded_at: '2025-11-20' },
];

export const mockMentorships: MentorshipRecord[] = [
  { id: 'mr1', mentor_id: '3', startup_id: 's1', session_date: '2026-03-20', notes: 'Discussed user acquisition strategies. Need to focus on organic growth channels.', feedback: 'Good progress on MVP. Prioritize onboarding flow.' },
  { id: 'mr2', mentor_id: '4', startup_id: 's2', session_date: '2026-03-18', notes: 'Reviewed prototype materials. Explored supplier options.', feedback: 'Consider partnerships with existing packaging companies.' },
  { id: 'mr3', mentor_id: '3', startup_id: 's4', session_date: '2026-03-15', notes: 'Growth metrics review. Discussed scaling strategy.', feedback: 'Impressive traction. Focus on unit economics.' },
];

export const mockActivities: ActivityLog[] = [
  { id: 'a1', user_id: '1', action: 'completed milestone', entity_type: 'milestone', entity_id: 'ml1', created_at: '2026-01-12T10:30:00Z' },
  { id: 'a2', user_id: '1', action: 'uploaded document', entity_type: 'document', entity_id: 'd2', created_at: '2026-01-05T14:20:00Z' },
  { id: 'a3', user_id: '2', action: 'started milestone', entity_type: 'milestone', entity_id: 'ml5', created_at: '2026-02-01T09:00:00Z' },
  { id: 'a4', user_id: '3', action: 'added feedback', entity_type: 'mentorship', entity_id: 'mr1', created_at: '2026-03-20T16:00:00Z' },
  { id: 'a5', user_id: '2', action: 'completed task', entity_type: 'task', entity_id: 't4', created_at: '2026-03-25T11:45:00Z' },
];

// Current mock user - change role to test different dashboards
export const currentMockUser: UserProfile = mockUsers[0]; // Alice (student)
