import { useAuth } from '@/contexts/AuthContext';
import StudentDashboard from './StudentDashboard';
import MentorDashboard from './MentorDashboard';
import AdminDashboard from './AdminDashboard';

export default function DashboardRouter() {
  const { role } = useAuth();

  switch (role) {
    case 'mentor': return <MentorDashboard />;
    case 'admin':
    case 'super_admin': return <AdminDashboard />;
    default: return <StudentDashboard />;
  }
}
