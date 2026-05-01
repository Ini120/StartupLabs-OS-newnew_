import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Rocket, Users, Target, GraduationCap, TrendingUp, BarChart2,
  Activity, ArrowRight, AlertCircle, CheckCircle2, XCircle,
  Clock, UserCheck, RefreshCw, ChevronDown, ChevronUp,
  CalendarDays, Bell, Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { StageBadge } from '@/components/shared/Stagebadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAllStartups } from '@/hooks/use-startups';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

/* ─── Constants ────────────────────────────────────────────── */
const STAGE_COLORS: Record<string, string> = {
  idea:       'hsl(218 85% 42%)',
  validation: 'hsl(32 95% 50%)',
  mvp:        'hsl(158 70% 38%)',
  growth:     'hsl(262 80% 55%)',
};
const STAGES = ['idea', 'validation', 'mvp', 'growth'] as const;

/* ─── Status badge helper ───────────────────────────────────── */
function AssignmentStatusBadge({ status }: { status: string }) {
  if (status === 'approved')
    return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" />Approved</Badge>;
  if (status === 'rejected')
    return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
  return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
}

/* ─── Single assignment row ─────────────────────────────────── */
function AssignmentRow({
  assignment,
  mentorProfile,
  studentProfile,
  onAction,
}: {
  assignment: any;
  mentorProfile?: any;
  studentProfile?: any;
  onAction: (id: string, action: 'approved' | 'rejected') => Promise<void>;
}) {
  const [loading, setLoading] = useState<'approved' | 'rejected' | null>(null);
  const [localStatus, setLocalStatus] = useState<string>(assignment.status);

  const handle = async (action: 'approved' | 'rejected') => {
    setLoading(action);
    try {
      await onAction(assignment.id, action);
      setLocalStatus(action);
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong. Please try again.';
      toast.error(`Failed to ${action === 'approved' ? 'approve' : 'reject'} assignment`, {
        description: msg,
      });
    } finally {
      setLoading(null);
    }
  };

  const isPending = localStatus === 'pending';

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        localStatus === 'approved'
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : localStatus === 'rejected'
          ? 'border-red-500/20 bg-red-500/5 opacity-70'
          : 'border-border/60 bg-card/60 hover:border-primary/30'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">

        {/* Mentor */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-9 w-9 ring-2 ring-primary/10 shrink-0">
            <AvatarImage src={mentorProfile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {(mentorProfile?.full_name || 'M').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Mentor</p>
            <p className="text-sm font-semibold truncate">{mentorProfile?.full_name || 'Unknown Mentor'}</p>
            <p className="text-[11px] text-muted-foreground truncate">{mentorProfile?.email || ''}</p>
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden sm:flex items-center text-muted-foreground/40 shrink-0">
          <ArrowRight className="h-4 w-4" />
        </div>

        {/* Student */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-9 w-9 ring-2 ring-violet-500/10 shrink-0">
            <AvatarImage src={studentProfile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {(studentProfile?.full_name || 'S').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Student</p>
            <p className="text-sm font-semibold truncate">{studentProfile?.full_name || 'Unknown Student'}</p>
            <p className="text-[11px] text-muted-foreground truncate">{studentProfile?.email || ''}</p>
          </div>
        </div>

        {/* Status + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <AssignmentStatusBadge status={localStatus} />

          {isPending && (
            <>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                onClick={() => handle('approved')}
                disabled={!!loading}
              >
                {loading === 'approved'
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <CheckCircle2 className="h-3.5 w-3.5" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                onClick={() => handle('rejected')}
                disabled={!!loading}
              >
                {loading === 'rejected'
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <XCircle className="h-3.5 w-3.5" />}
                Reject
              </Button>
            </>
          )}

          {!isPending && localStatus === 'approved' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs border-red-500/40 text-red-500 hover:bg-red-500/10"
              onClick={() => handle('rejected')}
              disabled={!!loading}
            >
              {loading === 'rejected' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Revoke
            </Button>
          )}

          {!isPending && localStatus === 'rejected' && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              onClick={() => handle('approved')}
              disabled={!!loading}
            >
              {loading === 'approved' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Re-approve
            </Button>
          )}
        </div>
      </div>

      {/* Requested at */}
      <p className="text-[10px] text-muted-foreground mt-2.5 flex items-center gap-1">
        <CalendarDays className="h-3 w-3" />
        Requested {assignment.created_at
          ? new Date(assignment.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'}
      </p>
    </div>
  );
}

/* ─── Assignments Panel ─────────────────────────────────────── */
function AssignmentsPanel({ pendingCount }: { pendingCount: number }) {
  const queryClient = useQueryClient();
  const { getToken } = useClerkAuth();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [expanded, setExpanded] = useState(true);

  const { data: assignments = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-all-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_assignments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch all involved profiles in one go
  const allUserIds = [...new Set(assignments.flatMap(a => [a.mentor_id, a.student_id]))];
  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-assignment-profiles', allUserIds.join(',')],
    enabled: allUserIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', allUserIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const profileFor = (uid: string) => profiles.find(p => p.user_id === uid);

  // Realtime subscription: update immediately when assignments change
  useEffect(() => {
    const channel = supabase
      .channel('admin-assignments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mentor_assignments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-all-assignments'] });
        queryClient.invalidateQueries({ queryKey: ['pending-assignments-count'] });
        // Also invalidate mentor & student caches so THEIR dashboards reflect instantly
        queryClient.invalidateQueries({ queryKey: ['mentor-assignments'] });
        queryClient.invalidateQueries({ queryKey: ['student-mentor-assignment'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    // Get the Clerk JWT so the Edge Function can verify admin identity
    const token = await getToken();
    // Decode JWT payload to see what user_id will be sent
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('[handleAction] JWT sub (callerId):', payload.sub);
      console.log('[handleAction] JWT full payload:', payload);
    } catch(e) { console.log('[handleAction] could not decode token'); }
    console.log('[handleAction] token:', token ? token.slice(0, 30) + '...' : 'NULL');
    if (!token) throw new Error('Not authenticated — please sign in again.');

    console.log('[handleAction] calling edge function with:', { assignment_id: id, status: action });

    const { data, error } = await supabase.functions.invoke('manage-assignment', {
      body: { assignment_id: id, status: action },
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('[handleAction] response data:', data);
    console.log('[handleAction] response error:', error);

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    queryClient.invalidateQueries({ queryKey: ['admin-all-assignments'] });
    queryClient.invalidateQueries({ queryKey: ['pending-assignments-count'] });
    queryClient.invalidateQueries({ queryKey: ['mentor-assignments'] });
    queryClient.invalidateQueries({ queryKey: ['student-mentor-assignment'] });
  };

  const filtered = filter === 'all' ? assignments : assignments.filter(a => a.status === filter);

  const counts = {
    all:      assignments.length,
    pending:  assignments.filter(a => a.status === 'pending').length,
    approved: assignments.filter(a => a.status === 'approved').length,
    rejected: assignments.filter(a => a.status === 'rejected').length,
  };

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Mentor Assignments
              </CardTitle>
              {expanded
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {pendingCount > 0 && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] gap-1 animate-pulse">
                <Bell className="h-2.5 w-2.5" />
                {pendingCount} pending
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => refetch()}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Filter tabs */}
        {expanded && (
          <div className="flex gap-1 mt-3 flex-wrap">
            {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filter === tab
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className={`text-[10px] tabular-nums ${filter === tab ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      {expanded && (
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-25" />
              <p className="text-sm">
                {filter === 'pending'
                  ? 'No pending assignments right now. You\'re all caught up!'
                  : `No ${filter} assignments found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(a => (
                <AssignmentRow
                  key={a.id}
                  assignment={a}
                  mentorProfile={profileFor(a.mentor_id)}
                  studentProfile={profileFor(a.student_id)}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/* ─── Main AdminDashboard ───────────────────────────────────── */
export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: startups = [], isLoading: sl } = useAllStartups();

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('Milestones').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: roleCounts = { students: 0, mentors: 0 } } = useQuery({
    queryKey: ['role-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('role');
      if (error) throw error;
      const students = data?.filter(r => r.role === 'student').length ?? 0;
      const mentors  = data?.filter(r => r.role === 'mentor').length ?? 0;
      return { students, mentors };
    },
  });

  const { data: pendingAssignments = [] } = useQuery({
    queryKey: ['pending-assignments-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_assignments')
        .select('id')
        .eq('status', 'pending');
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  // Fetch meetings stats
  const { data: meetingsStats = { total: 0, upcoming: 0 } } = useQuery({
    queryKey: ['admin-meetings-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('meetings').select('scheduled_at');
      if (error) throw error;
      const now = new Date();
      const upcoming = (data ?? []).filter(m => new Date(m.scheduled_at) >= now).length;
      return { total: data?.length ?? 0, upcoming };
    },
  });

  // Real cohort growth from DB: count profiles created per month
  const { data: cohortGrowth = [] } = useQuery({
    queryKey: ['cohort-growth'],
    queryFn: async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('created_at, role:user_roles(role)')
        .order('created_at', { ascending: true });
      if (!profileData) return [];

      const byMonth: Record<string, { month: string; students: number; startups: number }> = {};
      profileData.forEach((p: any) => {
        const d = new Date(p.created_at);
        const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
        if (!byMonth[key]) byMonth[key] = { month: key, students: 0, startups: 0 };
        if (p.role?.[0]?.role === 'student') byMonth[key].students++;
      });
      // Add startups per month
      startups.forEach((s: any) => {
        const d = new Date(s.created_at);
        const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
        if (byMonth[key]) byMonth[key].startups++;
      });
      return Object.values(byMonth).slice(-6);
    },
    enabled: startups.length >= 0,
  });

  /* ── derived ─────────────────────────────────────────────── */
  const completedMilestones  = milestones.filter((m: any) => m.status === 'completed').length;
  const inProgressMilestones = milestones.filter((m: any) => m.status === 'in-progress').length;
  const displayName = user?.full_name || 'Admin';

  const stageData = STAGES.map(stage => ({
    name:  stage.charAt(0).toUpperCase() + stage.slice(1),
    value: startups.filter(s => s.stage === stage).length,
    color: STAGE_COLORS[stage],
  })).filter(d => d.value > 0);

  const milestoneStatusData = [
    { status: 'Completed',   count: completedMilestones },
    { status: 'In Progress', count: inProgressMilestones },
    { status: 'Pending',     count: milestones.filter((m: any) => m.status === 'pending').length },
  ];

  const startupProgress = startups.map(s => {
    const sml  = milestones.filter((m: any) => m.startup_id === s.id);
    const done = sml.filter((m: any) => m.status === 'completed').length;
    return { ...s, pct: sml.length ? Math.round((done / sml.length) * 100) : 0, total: sml.length, done };
  }).sort((a, b) => b.pct - a.pct);

  const approvedAssignmentsCount = pendingAssignments.length; // reused query key gives pending count

  if (sl) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl px-7 py-6 border border-border/40 shadow-sm"
        style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(218 30% 12%) 100%)' }}>
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Admin</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Welcome back, {displayName}
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Here's what's happening across the lab today.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/admin/user-management">
                <Users className="h-3.5 w-3.5 text-primary" />Manage Users
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/admin/analytics">
                <BarChart2 className="h-3.5 w-3.5 text-success" />Analytics
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Pending banner ────────────────────────────────────── */}
      {pendingAssignments.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/40 bg-amber-500/8 text-sm">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
          </span>
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-amber-600 font-medium">
            {pendingAssignments.length} mentor assignment{pendingAssignments.length > 1 ? 's' : ''} awaiting your approval
          </span>
          <button
            onClick={() => {
              document.getElementById('assignments-panel')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="ml-auto flex items-center gap-1 text-xs text-amber-600 font-semibold hover:underline"
          >
            Review now <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* ── KPI cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Startups"     value={startups.length}         icon={Rocket}       accent="primary" />
        <StatCard title="Students"           value={roleCounts.students}     icon={GraduationCap} accent="success" />
        <StatCard title="Mentors"            value={roleCounts.mentors}      icon={Users}         accent="warning" />
        <StatCard
          title="Upcoming Meetings"
          value={meetingsStats.upcoming}
          icon={CalendarDays}
          description={`${meetingsStats.total} total booked`}
          accent="primary"
        />
      </div>

      {/* ── Second KPI row ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Milestones Done"   value={completedMilestones}      icon={Target}        accent="primary" description={`of ${milestones.length} total`} />
        <StatCard title="In Progress"       value={inProgressMilestones}     icon={Activity}      accent="warning" />
        <StatCard title="Pending Reviews"   value={pendingAssignments.length} icon={Clock}        accent="warning" />
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4 flex flex-col justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Mentor Coverage</p>
          <p className="text-3xl font-black tabular-nums text-primary mt-1">
            {roleCounts.students > 0
              ? `${Math.round((roleCounts.mentors / roleCounts.students) * 100)}%`
              : '—'}
          </p>
          <Progress
            value={roleCounts.students > 0 ? Math.min(100, (roleCounts.mentors / roleCounts.students) * 100) : 0}
            className="h-1.5 mt-2"
          />
        </div>
      </div>

      {/* ── Charts row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Cohort growth */}
        <Card className="lg:col-span-2 border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Cohort Growth
            </CardTitle>
            <p className="text-xs text-muted-foreground">Students and startups joined over time</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cohortGrowth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="students" stroke="hsl(218 85% 42%)" strokeWidth={2.5} dot={{ r: 3 }} name="Students" />
                <Line type="monotone" dataKey="startups" stroke="hsl(158 70% 38%)" strokeWidth={2.5} dot={{ r: 3 }} name="Startups" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stage distribution */}
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stage Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">Startups by current stage</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {stageData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={stageData} cx="50%" cy="50%" outerRadius={62} paddingAngle={3} dataKey="value">
                      {stageData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 mt-2 w-full">
                  {stageData.map(entry => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: entry.color }} />
                        {entry.name}
                      </span>
                      <span className="font-semibold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                <Rocket className="h-8 w-8 mb-2 opacity-20" />No startups yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Milestone + Community row ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Milestone bar chart */}
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Milestone Status
            </CardTitle>
            <p className="text-xs text-muted-foreground">All milestones across every startup</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={milestoneStatusData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Milestones">
                  {milestoneStatusData.map((_, i) => (
                    <Cell key={i} fill={['hsl(158 70% 38%)', 'hsl(32 95% 50%)', 'hsl(215 22% 75%)'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Community overview */}
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Community Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Students',   value: roleCounts.students, color: 'bg-primary/10 text-primary' },
                { label: 'Mentors',    value: roleCounts.mentors,  color: 'bg-warning/10 text-warning' },
                { label: 'Startups',   value: startups.length,     color: 'bg-success/10 text-success' },
                { label: 'Milestones', value: milestones.length,   color: 'bg-purple-500/10 text-purple-600' },
              ].map(item => (
                <div key={item.label} className={`rounded-xl p-3.5 ${item.color.split(' ')[0]}`}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-2xl font-black tabular-nums ${item.color.split(' ')[1]}`}
                    style={{ fontFamily: 'var(--font-heading)' }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mentor-to-student ratio</span>
                <span className="font-medium text-foreground">
                  {roleCounts.students > 0
                    ? `${Math.round((roleCounts.mentors / roleCounts.students) * 100)}%`
                    : '—'}
                </span>
              </div>
              <Progress
                value={roleCounts.students > 0 ? Math.min(100, (roleCounts.mentors / roleCounts.students) * 100) : 0}
                className="h-2"
              />
              <p className="text-[10px] text-muted-foreground">
                {roleCounts.mentors} mentor{roleCounts.mentors !== 1 ? 's' : ''} covering {roleCounts.students} student{roleCounts.students !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── MENTOR ASSIGNMENTS PANEL ──────────────────────────── */}
      <div id="assignments-panel">
        <AssignmentsPanel pendingCount={pendingAssignments.length} />
      </div>

      {/* ── All Startups table ────────────────────────────────── */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">All Startups</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Ranked by milestone completion</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
            <Link to="/admin/all-startups">View all <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {startups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Rocket className="h-10 w-10 mx-auto mb-2 opacity-20" />No startups created yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Startup</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Milestones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {startupProgress.slice(0, 8).map((startup, idx) => (
                  <TableRow key={startup.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] text-muted-foreground/60 font-mono w-4 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-sm">{startup.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><StageBadge stage={startup.stage as any} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={startup.pct} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-8 tabular-nums">{startup.pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                      {startup.done}/{startup.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}