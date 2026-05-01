import { useState, useMemo } from 'react';
import {
  Rocket, Target, FileText, TrendingUp, Clock, CheckCircle2, Circle,
  Plus, ArrowRight, Calendar, Zap, Video, MapPin, User, Flame, Star,
  ChevronRight, BookOpen, Award, X, Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useMyStartups } from '@/hooks/use-startups';
import { useMilestonesByStartups } from '@/hooks/use-milestones';
import { StageBadge } from '@/components/shared/Stagebadge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

/* ─── Static data ─────────────────────────────────────────── */
const weeklyActivity = [
  { day: 'Mon', milestones: 0, docs: 1 },
  { day: 'Tue', milestones: 1, docs: 0 },
  { day: 'Wed', milestones: 2, docs: 2 },
  { day: 'Thu', milestones: 1, docs: 0 },
  { day: 'Fri', milestones: 3, docs: 1 },
  { day: 'Sat', milestones: 0, docs: 0 },
  { day: 'Sun', milestones: 1, docs: 1 },
];

const statusColors = {
  completed: '#10b981',
  'in-progress': '#f59e0b',
  pending: '#94a3b8',
};

const quickActions = [
  { label: 'Add Milestone', icon: Target, to: '/milestones', bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20' },
  { label: 'Upload Doc', icon: FileText, to: '/documents', bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
  { label: 'My Startup', icon: Rocket, to: '/my-startup', bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
];

/* ─── Sub-components ──────────────────────────────────────── */
function KpiCard({
  label, value, sub, icon: Icon, gradient, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; gradient: string; trend?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} border border-white/10 shadow-lg`}>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">{label}</p>
          <p className="mt-1.5 text-3xl font-black text-white">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-white/50">{sub}</p>}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-white/70">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ title, action, to }: { title: string; action?: string; to?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
      {action && to && (
        <Link to={to} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {action} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

/* ─── Book Meeting Modal ──────────────────────────────────── */
function BookMeetingModal({
  open,
  onClose,
  startups,
  mentorId,
  mentorName,
}: {
  open: boolean;
  onClose: () => void;
  startups: any[];
  mentorId: string | null;
  mentorName: string;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    startup_id: '',
    title: '',
    scheduled_at: '',
    duration_minutes: '60',
    meeting_type: 'virtual',
    meeting_link: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.startup_id || !form.scheduled_at) {
      setError('Please select a startup and a date/time.');
      return;
    }
    if (!mentorId) {
      setError('No mentor assigned yet.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('meetings').insert({
      startup_id: form.startup_id,
      mentor_id: mentorId,
      title: form.title || 'Mentorship Session',
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: parseInt(form.duration_minutes, 10),
      meeting_type: form.meeting_type,
      meeting_link: form.meeting_link || null,
      notes: form.notes || null,
      status: 'pending',
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    // Invalidate mentor's meetings query so it refreshes on their dashboard
    queryClient.invalidateQueries({ queryKey: ['mentor-booked-meetings'] });
    queryClient.invalidateQueries({ queryKey: ['student-booked-meetings'] });
    setTimeout(() => { setSuccess(false); onClose(); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div>
            <h2 className="text-base font-bold">Book a Meeting</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Schedule a session with {mentorName}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {success && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-600 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Meeting booked! Your mentor will see it on their dashboard.
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Startup picker */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Startup *
            </label>
            <select
              value={form.startup_id}
              onChange={e => setForm(f => ({ ...f, startup_id: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Select a startup…</option>
              {startups.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Session Title
            </label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. MVP Review, Pitch Practice…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Date/time */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Duration + Type row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Duration</label>
              <select
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Format</label>
              <select
                value={form.meeting_type}
                onChange={e => setForm(f => ({ ...f, meeting_type: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="virtual">Virtual</option>
                <option value="in-person">In-person</option>
              </select>
            </div>
          </div>

          {/* Meeting link (virtual only) */}
          {form.meeting_type === 'virtual' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Meeting Link
              </label>
              <input
                value={form.meeting_link}
                onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))}
                placeholder="https://meet.google.com/…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Notes / Agenda
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="What do you want to discuss?"
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0 gap-2"
            onClick={handleSubmit}
            disabled={saving || success}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            {saving ? 'Booking…' : 'Confirm Booking'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────────── */
export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: startups = [], isLoading: startupsLoading } = useMyStartups();
  const startupIds = useMemo(() => startups.map(s => s.id), [startups]);
  const { data: milestones = [], isLoading: milestonesLoading } = useMilestonesByStartups(startupIds);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [bookingOpen, setBookingOpen] = useState(false);

  // Fetch mentor assignment for this student
  const { data: assignment } = useQuery({
    queryKey: ['student-mentor-assignment', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('mentor_assignments')
        .select('mentor_id, mentor:profiles!mentor_assignments_mentor_id_fkey(full_name)')
        .eq('student_id', user!.id)
        .eq('status', 'approved')
        .maybeSingle();
      return data;
    },
  });

  // Fetch this student's booked meetings
  const { data: myMeetings = [] } = useQuery({
    queryKey: ['student-booked-meetings', startupIds.join(',')],
    enabled: startupIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('meetings')
        .select('*')
        .in('startup_id', startupIds)
        .order('scheduled_at', { ascending: true });
      return data ?? [];
    },
  });

  const mentorId = assignment?.mentor_id ?? null;
  const mentorName = (assignment?.mentor as any)?.full_name ?? 'Your Mentor';
  const upcomingMeetings = myMeetings.filter(m => new Date(m.scheduled_at) >= new Date());

  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const inProgressMilestones = milestones.filter(m => m.status === 'in-progress').length;
  const pendingMilestones = milestones.filter(m => m.status === 'pending').length;
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'there';
  const overallPct = milestones.length ? Math.round((completedMilestones / milestones.length) * 100) : 0;
  const isLoading = startupsLoading || milestonesLoading;

  const milestonePie = [
    { name: 'Completed', value: completedMilestones, color: statusColors.completed },
    { name: 'In Progress', value: inProgressMilestones, color: statusColors['in-progress'] },
    { name: 'Pending', value: pendingMilestones, color: statusColors.pending },
  ].filter(d => d.value > 0);

  const filteredMilestones = activeTab === 'all' ? milestones : milestones.filter(m => m.status === activeTab);

  const statusIcon: Record<string, JSX.Element> = {
    completed: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    'in-progress': <Clock className="h-4 w-4 text-amber-500" />,
    pending: <Circle className="h-4 w-4 text-slate-400" />,
  };

  const tabs = ['all', 'pending', 'in-progress', 'completed'] as const;
  const tabCounts = {
    all: milestones.length,
    pending: pendingMilestones,
    'in-progress': inProgressMilestones,
    completed: completedMilestones,
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Book Meeting Modal ─────────────────────────────── */}
      <BookMeetingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        startups={startups}
        mentorId={mentorId}
        mentorName={mentorName}
      />

      <div className="space-y-8 px-1 pb-10">

        {/* ── HERO HEADER ───────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl p-7 shadow-2xl border border-white/5" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #0f0c29 40%, #1a1040 70%, #0d1117 100%)' }}>
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute bottom-0 left-24 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-indigo-300">
                <Flame className="h-3 w-3" /> Student Portal
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Hey, {displayName} 👋
              </h1>
              <p className="mt-1.5 text-sm text-slate-400 max-w-md">
                You're {overallPct}% through your milestones. Keep building — great things take time.
              </p>

              {milestones.length > 0 && (
                <div className="mt-4 flex items-center gap-3 max-w-sm">
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all duration-700"
                      style={{ width: `${overallPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white/70 tabular-nums">{overallPct}%</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
              {quickActions.map(qa => (
                <Link
                  key={qa.label}
                  to={qa.to}
                  className={`flex items-center gap-2 rounded-xl border ${qa.border} ${qa.bg} px-4 py-2.5 text-xs font-semibold ${qa.text} transition-all hover:scale-105 hover:shadow-lg`}
                >
                  <qa.icon className="h-3.5 w-3.5" />
                  {qa.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="My Startups" value={startups.length} icon={Rocket}
            gradient="bg-gradient-to-br from-indigo-600 to-indigo-800"
            trend="Active ventures" />
          <KpiCard label="Milestones Done" value={`${completedMilestones}/${milestones.length}`}
            icon={Award} gradient="bg-gradient-to-br from-emerald-600 to-emerald-800"
            trend={`${overallPct}% complete`} />
          <KpiCard label="In Progress" value={inProgressMilestones} icon={Zap}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            trend="Tasks active" />
          <KpiCard label="Upcoming Meetings" value={upcomingMeetings.length} icon={Calendar}
            gradient="bg-gradient-to-br from-violet-600 to-purple-800"
            trend="Booked sessions" />
        </div>

        {/* ── CHARTS ROW ────────────────────────────────────── */}
        <div>
          <SectionHeading title="Activity" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Area chart */}
            <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
              <p className="text-sm font-bold text-foreground mb-0.5">Weekly Activity</p>
              <p className="text-xs text-muted-foreground mb-4">Milestones updated & documents uploaded</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={weeklyActivity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="milestones" stroke="#6366f1" fill="url(#gM)" strokeWidth={2.5} name="Milestones" />
                  <Area type="monotone" dataKey="docs" stroke="#f59e0b" fill="url(#gD)" strokeWidth={2.5} name="Documents" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
              <p className="text-sm font-bold text-foreground mb-0.5">Milestone Breakdown</p>
              <p className="text-xs text-muted-foreground mb-2">Distribution by status</p>
              {milestonePie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={milestonePie} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={4} dataKey="value">
                        {milestonePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-2">
                    {milestonePie.map(entry => (
                      <div key={entry.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full inline-block" style={{ background: entry.color }} />
                          <span className="text-muted-foreground">{entry.name}</span>
                        </span>
                        <span className="font-bold tabular-nums">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm text-center">
                  <Target className="h-8 w-8 mb-2 opacity-20" />No milestones yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MY STARTUPS + MILESTONES ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Startups */}
          <div>
            <SectionHeading title="My Startups" action="Manage" to="/my-startup" />
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
              {startups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-muted-foreground text-sm">
                  <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <Rocket className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="font-medium">No startups yet</p>
                  <p className="text-xs mt-1 text-muted-foreground/70">Launch your first venture today</p>
                  <Button asChild variant="outline" size="sm" className="mt-4 gap-1.5 rounded-xl">
                    <Link to="/my-startup"><Plus className="h-3.5 w-3.5" />Create Startup</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {startups.map(startup => {
                    const sml = milestones.filter(m => m.startup_id === startup.id);
                    const done = sml.filter(m => m.status === 'completed').length;
                    const pct = sml.length ? Math.round((done / sml.length) * 100) : 0;
                    return (
                      <div key={startup.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <Rocket className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm truncate">{startup.name}</p>
                            <StageBadge stage={startup.stage as any} />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{done}/{sml.length}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Milestones */}
          <div>
            <SectionHeading title="Milestones" action="View all" to="/milestones" />
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
              {/* filter tabs */}
              <div className="flex gap-1 p-3 border-b border-border/50 bg-muted/20">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      activeTab === tab
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {tab === 'in-progress' ? 'Active' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span className={`text-[10px] tabular-nums ${activeTab === tab ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
                      {tabCounts[tab]}
                    </span>
                  </button>
                ))}
              </div>

              {filteredMilestones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                  <Target className="h-8 w-8 mb-2 opacity-20" />
                  No milestones here yet
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredMilestones.slice(0, 5).map(m => {
                    const startup = startups.find(s => s.id === m.startup_id);
                    const isOverdue = m.due_date && new Date(m.due_date) < new Date() && m.status !== 'completed';
                    return (
                      <div key={m.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors">
                        <div className="mt-0.5 shrink-0">{statusIcon[m.status] ?? statusIcon.pending}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.title}</p>
                          {startup && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Rocket className="h-2.5 w-2.5" />{startup.name}
                            </p>
                          )}
                        </div>
                        {m.due_date && (
                          <div className={`flex items-center gap-1 text-[11px] shrink-0 font-medium ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                            <Calendar className="h-3 w-3" />
                            {new Date(m.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MENTOR SECTION ────────────────────────────────── */}
        <div>
          <SectionHeading title="Mentorship" action="View schedule" to="/mentorship" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Mentor booking card */}
            <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border/50 shadow-sm">
              <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
              <div className="p-6 bg-card">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* mentor info */}
                  <div className="flex flex-col items-center text-center shrink-0">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border-2 border-indigo-500/30 flex items-center justify-center">
                        <User className="h-10 w-10 text-indigo-400" />
                      </div>
                      <div className="absolute -bottom-1.5 -right-1.5 h-5 w-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                        <Star className="h-2.5 w-2.5 text-white fill-white" />
                      </div>
                    </div>
                    <p className="mt-3 font-bold text-sm">{mentorName}</p>
                    <p className="text-[11px] text-muted-foreground">Your assigned mentor</p>
                    <div className="flex gap-1 mt-2">
                      {mentorId ? (
                        <Badge variant="outline" className="text-[10px] rounded-full border-emerald-500/30 text-emerald-600">Available</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] rounded-full border-amber-500/30 text-amber-600">Pending assignment</Badge>
                      )}
                    </div>
                  </div>

                  {/* meeting details */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { icon: Video, label: 'Format', val: '1-on-1 Video Call', color: 'text-violet-500 bg-violet-500/10' },
                      { icon: Calendar, label: 'Next Meeting', val: upcomingMeetings.length > 0 ? new Date(upcomingMeetings[0].scheduled_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : 'None booked', color: 'text-indigo-500 bg-indigo-500/10' },
                      { icon: Clock, label: 'Total Booked', val: `${myMeetings.length} session${myMeetings.length !== 1 ? 's' : ''}`, color: 'text-amber-500 bg-amber-500/10' },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
                        <div className={`h-8 w-8 rounded-lg ${item.color} flex items-center justify-center mb-2`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <p className="text-[11px] text-muted-foreground">{item.label}</p>
                        <p className="text-xs font-bold mt-0.5">{item.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="mt-5 w-full h-10 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0 shadow-lg shadow-indigo-500/20 gap-2"
                  onClick={() => setBookingOpen(true)}
                  disabled={!mentorId || startups.length === 0}
                >
                  <Calendar className="h-4 w-4" />
                  {!mentorId ? 'No mentor assigned yet' : startups.length === 0 ? 'Create a startup first' : 'Book a Meeting'}
                </Button>
              </div>
            </div>

            {/* Upcoming meetings mini-list */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
              <p className="text-sm font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> My Meetings
              </p>
              {upcomingMeetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-center">
                  <Calendar className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-xs">No upcoming meetings.<br />Book one with your mentor!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingMeetings.slice(0, 4).map(m => (
                    <div key={m.id} className="rounded-xl border border-border/40 p-3 hover:bg-muted/20 transition-colors">
                      <p className="text-xs font-semibold truncate">{m.title || 'Mentorship Session'}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(m.scheduled_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${m.status === 'confirmed' ? 'border-emerald-500/30 text-emerald-600' : 'border-amber-500/30 text-amber-600'}`}>
                          {m.status}
                        </Badge>
                        {m.meeting_type === 'virtual' && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                            <Video className="h-2.5 w-2.5" /> Virtual
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {upcomingMeetings.length > 4 && (
                    <p className="text-[11px] text-center text-muted-foreground">+{upcomingMeetings.length - 4} more</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}