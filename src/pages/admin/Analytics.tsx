import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAllStartups } from '@/hooks/use-startups';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StageBadge } from '@/components/shared/Stagebadge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, Users, Target, CheckCircle2, Clock,
  Rocket, GraduationCap, UserCheck, CalendarDays, BarChart3,
} from 'lucide-react';

/* ── colour tokens ───────────────────────────────────────────── */
const STAGE_COLORS: Record<string, string> = {
  idea:       'hsl(218 85% 55%)',
  validation: 'hsl(32 95% 55%)',
  mvp:        'hsl(158 65% 42%)',
  growth:     'hsl(262 75% 60%)',
};
const STAGES = ['idea', 'validation', 'mvp', 'growth'] as const;

const STATUS_COLORS = {
  completed:   'hsl(158 65% 42%)',
  'in-progress': 'hsl(32 95% 55%)',
  pending:     'hsl(215 20% 65%)',
};

/* ── tiny helpers ────────────────────────────────────────────── */
function StatTile({
  icon: Icon, label, value, sub, color = 'text-primary',
}: {
  icon: any; label: string; value: number | string; sub?: string; color?: string;
}) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center bg-muted/60 shrink-0`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-black tabular-nums leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground/60 mt-0.5">{description}</p>}
      </div>
      <div className="flex-1 h-px bg-border/40 mb-1" />
    </div>
  );
}

/* ── skeleton loader ─────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

/* ── custom tooltip ──────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-bold ml-0.5">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
export default function Analytics() {
  /* ── data fetching ─────────────────────────────────────────── */
  const { data: startups = [], isLoading: sl } = useAllStartups();

  const { data: milestones = [], isLoading: ml } = useQuery({
    queryKey: ['milestones', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('Milestones').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: roles = [], isLoading: rl } = useQuery({
    queryKey: ['all-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['admin-all-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mentor_assignments').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ['admin-meetings-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('meetings').select('scheduled_at');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('created_at, user_id');
      if (error) throw error;
      return data ?? [];
    },
  });

  const isLoading = sl || ml || rl;

  /* ── derived metrics ───────────────────────────────────────── */
  const students = roles.filter((r: any) => r.role === 'student').length;
  const mentors  = roles.filter((r: any) => r.role === 'mentor').length;
  const completedMilestones   = milestones.filter((m: any) => m.status === 'completed').length;
  const inProgressMilestones  = milestones.filter((m: any) => m.status === 'in-progress').length;
  const pendingMilestones     = milestones.filter((m: any) => m.status === 'pending').length;
  const milestoneCompletionPct = milestones.length
    ? Math.round((completedMilestones / milestones.length) * 100) : 0;
  const now = new Date();
  const upcomingMeetings = meetings.filter((m: any) => new Date(m.scheduled_at) >= now).length;
  const approvedAssignments = assignments.filter((a: any) => a.status === 'approved').length;

  /* ── stage distribution ────────────────────────────────────── */
  const stageData = useMemo(() => STAGES.map(stage => ({
    name: stage.charAt(0).toUpperCase() + stage.slice(1),
    value: startups.filter((s: any) => s.stage === stage).length,
    color: STAGE_COLORS[stage],
  })).filter(d => d.value > 0), [startups]);

  /* ── milestone status chart ────────────────────────────────── */
  const milestoneStatusData = useMemo(() => [
    { status: 'Completed',   count: completedMilestones,  fill: STATUS_COLORS.completed },
    { status: 'In Progress', count: inProgressMilestones, fill: STATUS_COLORS['in-progress'] },
    { status: 'Pending',     count: pendingMilestones,     fill: STATUS_COLORS.pending },
  ], [completedMilestones, inProgressMilestones, pendingMilestones]);

  /* ── cohort growth (last 6 months) ─────────────────────────── */
  const cohortGrowth = useMemo(() => {
    const byMonth: Record<string, { month: string; students: number; startups: number; mentors: number }> = {};
    const addMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
    };
    profiles.forEach((p: any) => {
      const key = addMonth(p.created_at);
      if (!byMonth[key]) byMonth[key] = { month: key, students: 0, startups: 0, mentors: 0 };
    });
    roles.forEach((r: any) => {
      const profile = profiles.find((p: any) => p.user_id === r.user_id);
      if (!profile) return;
      const key = addMonth(profile.created_at);
      if (!byMonth[key]) byMonth[key] = { month: key, students: 0, startups: 0, mentors: 0 };
      if (r.role === 'student') byMonth[key].students++;
      if (r.role === 'mentor')  byMonth[key].mentors++;
    });
    startups.forEach((s: any) => {
      const key = addMonth(s.created_at);
      if (byMonth[key]) byMonth[key].startups++;
    });
    return Object.values(byMonth).slice(-6);
  }, [profiles, roles, startups]);

  /* ── startup progress (top 6) ──────────────────────────────── */
  const startupProgress = useMemo(() => startups.map((s: any) => {
    const sm = milestones.filter((m: any) => m.startup_id === s.id);
    const done = sm.filter((m: any) => m.status === 'completed').length;
    const pct  = sm.length ? Math.round((done / sm.length) * 100) : 0;
    return { ...s, done, total: sm.length, pct };
  }).sort((a: any, b: any) => b.pct - a.pct).slice(0, 6), [startups, milestones]);

  /* ── assignment funnel ─────────────────────────────────────── */
  const assignmentFunnel = useMemo(() => [
    { label: 'Total',    value: assignments.length,                                           color: 'hsl(215 22% 75%)' },
    { label: 'Approved', value: approvedAssignments,                                          color: 'hsl(158 65% 42%)' },
    { label: 'Pending',  value: assignments.filter((a: any) => a.status === 'pending').length, color: 'hsl(32 95% 55%)' },
    { label: 'Rejected', value: assignments.filter((a: any) => a.status === 'rejected').length, color: 'hsl(0 72% 58%)' },
  ], [assignments, approvedAssignments]);

  /* ══════════════════════════════════════════════════════════════ */
  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-8">

      {/* ── Page header ────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Lab performance and engagement insights.</p>
        </div>
        <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live data
        </Badge>
      </div>

      {/* ── KPI row ────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Overview" description="Key numbers at a glance" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile icon={Rocket}       label="Active Startups"    value={startups.length}         color="text-primary" />
          <StatTile icon={GraduationCap} label="Students"          value={students}                 color="text-violet-500" />
          <StatTile icon={UserCheck}    label="Mentors"            value={mentors}                  color="text-amber-500" />
          <StatTile icon={Target}       label="Milestone Completion" value={`${milestoneCompletionPct}%`} sub={`${completedMilestones} of ${milestones.length} done`} color="text-emerald-500" />
          <StatTile icon={CheckCircle2} label="Completed Milestones" value={completedMilestones}   color="text-emerald-500" />
          <StatTile icon={Clock}        label="In-Progress"        value={inProgressMilestones}     color="text-amber-500" />
          <StatTile icon={CalendarDays} label="Upcoming Meetings"  value={upcomingMeetings}         sub={`${meetings.length} total`} color="text-blue-500" />
          <StatTile icon={Users}        label="Active Assignments" value={approvedAssignments}      sub={`${assignments.length} total`} color="text-pink-500" />
        </div>
      </section>

      {/* ── Charts row 1 ───────────────────────────────────────── */}
      <section>
        <SectionHeader title="Growth" description="Community growth over the last 6 months" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Cohort growth line chart */}
          <Card className="border-border/60 bg-card/80 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Cohort Growth
              </CardTitle>
              <p className="text-xs text-muted-foreground">Students, mentors & startups by month</p>
            </CardHeader>
            <CardContent>
              {cohortGrowth.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  No growth data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={cohortGrowth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="students" stroke="hsl(262 75% 60%)" strokeWidth={2} dot={{ r: 3 }} name="Students" />
                    <Line type="monotone" dataKey="mentors"  stroke="hsl(32 95% 55%)"  strokeWidth={2} dot={{ r: 3 }} name="Mentors" />
                    <Line type="monotone" dataKey="startups" stroke="hsl(158 65% 42%)" strokeWidth={2} dot={{ r: 3 }} name="Startups" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Stage distribution pie */}
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Stage Distribution
              </CardTitle>
              <p className="text-xs text-muted-foreground">Startups by stage</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {stageData.length === 0 ? (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                  No startups yet
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={stageData} cx="50%" cy="50%" outerRadius={60} paddingAngle={3} dataKey="value">
                        {stageData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full space-y-1.5 mt-1">
                    {stageData.map(entry => (
                      <div key={entry.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-sm inline-block" style={{ background: entry.color }} />
                          {entry.name}
                        </span>
                        <span className="font-semibold tabular-nums">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Charts row 2 ───────────────────────────────────────── */}
      <section>
        <SectionHeader title="Milestones & Assignments" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Milestone status bar chart */}
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Milestone Status
              </CardTitle>
              <p className="text-xs text-muted-foreground">{milestones.length} milestones across all startups</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={milestoneStatusData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Milestones">
                    {milestoneStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Assignment funnel */}
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Assignment Funnel
              </CardTitle>
              <p className="text-xs text-muted-foreground">Mentor–student assignment breakdown</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {assignmentFunnel.map(item => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-sm inline-block" style={{ background: item.color }} />
                      {item.label}
                    </span>
                    <span className="tabular-nums font-bold">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: assignments.length ? `${Math.round((item.value / assignments.length) * 100)}%` : '0%',
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No assignments yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Startup leaderboard ─────────────────────────────────── */}
      <section>
        <SectionHeader title="Startup Leaderboard" description="Ranked by milestone completion" />
        <Card className="border-border/60 bg-card/80">
          <CardContent className="p-0">
            {startupProgress.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Rocket className="h-10 w-10 mx-auto mb-2 opacity-20" />
                No startups yet
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {startupProgress.map((s: any, idx: number) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                    <span className="text-xs font-mono text-muted-foreground/50 w-5 shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm font-semibold truncate">{s.name}</p>
                        <StageBadge stage={s.stage} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={s.pct} className="h-1.5 flex-1" />
                        <span className="text-[11px] text-muted-foreground tabular-nums w-16 text-right shrink-0">
                          {s.done}/{s.total} · {s.pct}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

    </div>
  );
}