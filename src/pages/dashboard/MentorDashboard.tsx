import { Link } from 'react-router-dom';
import {
  Rocket, Users, Target, ArrowRight, MessageSquare, Clock,
  CheckCircle2, Circle, TrendingUp, Award, Activity,
  CalendarDays, Video, MapPin, ExternalLink, Bell, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/shared/StatCard';
import { StageBadge } from '@/components/shared/Stagebadge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMentorRealtime } from '@/hooks/use-mentor-realtime';
import type { StartupStage } from '@/types';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatMeetingDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const time = d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });

  if (diffDays === 0) return { label: 'Today', sub: time, isUrgent: true };
  if (diffDays === 1) return { label: 'Tomorrow', sub: time, isUrgent: true };
  if (diffDays < 0) return { label: date, sub: time, isUrgent: false };
  return { label: date, sub: time, isUrgent: false };
}

// ─── component ──────────────────────────────────────────────────────────────

export default function MentorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const displayName = user?.full_name || 'Mentor';
  useMentorRealtime(user?.id);

  // ── Realtime: instantly reflect new bookings from students ──
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('mentor-meetings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings', filter: `mentor_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['mentor-booked-meetings', user.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  // ── assigned students ──
  const { data: assignments = [], isLoading: aLoading } = useQuery({
    queryKey: ['mentor-assignments', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_assignments')
        .select('*')
        .eq('mentor_id', user!.id)
        .eq('status', 'approved');
      if (error) throw error;
      return data ?? [];
    },
  });

  const studentIds = assignments.map(a => a.student_id);

  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['mentor-student-profiles', studentIds.join(',')],
    enabled: studentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', studentIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: startups = [], isLoading: sLoading } = useQuery({
    queryKey: ['mentor-student-startups', studentIds.join(',')],
    enabled: studentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Startups')
        .select('*')
        .in('student_id', studentIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const startupIds = startups.map(s => s.id);

  const { data: milestones = [] } = useQuery({
    queryKey: ['mentor-student-milestones', startupIds.join(',')],
    enabled: startupIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Milestones')
        .select('*')
        .in('startup_id', startupIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['mentor-sessions', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('MentorshipRecords')
        .select('*')
        .eq('mentor_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── booked meetings (startup → mentor) ──
  const { data: bookedMeetings = [], isLoading: mLoading, refetch: refetchMeetings } = useQuery({
    queryKey: ['mentor-booked-meetings', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')                         // adjust table name if different
        .select('*')
        .eq('mentor_id', user!.id)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000, // realtime handles instant updates; this is a fallback
  });

  // ── derived ──────────────────────────────────────────────────────────────

  if (aLoading || sLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const inProgressMilestones = milestones.filter(m => m.status === 'in-progress').length;
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const overallPct = milestones.length
    ? Math.round((completedMilestones / milestones.length) * 100)
    : 0;

  const profileFor = (uid: string) => studentProfiles.find(p => p.user_id === uid);
  const startupsFor = (uid: string) => startups.filter(s => s.student_id === uid);
  const milestonesFor = (sid: string) => milestones.filter(m => m.startup_id === sid);
  const progressFor = (sid: string) => {
    const ms = milestonesFor(sid);
    if (!ms.length) return 0;
    return Math.round((ms.filter(m => m.status === 'completed').length / ms.length) * 100);
  };

  const menteeProgressData = assignments.map(a => {
    const profile = profileFor(a.student_id);
    const allMs = startupsFor(a.student_id).flatMap(s => milestonesFor(s.id));
    const done = allMs.filter(m => m.status === 'completed').length;
    return {
      name: (profile?.full_name || 'Student').split(' ')[0],
      progress: allMs.length ? Math.round((done / allMs.length) * 100) : 0,
      milestones: allMs.length,
    };
  });

  const stageCounts = { idea: 0, validation: 0, mvp: 0, growth: 0 };
  startups.forEach(s => { if (s.stage in stageCounts) (stageCounts as any)[s.stage]++; });
  const radarData = Object.entries(stageCounts).map(([stage, count]) => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    count,
  }));

  // Split meetings into upcoming vs past
  const now = new Date();
  const upcomingMeetings = bookedMeetings.filter(m => new Date(m.scheduled_at) >= now);
  const pastMeetings = bookedMeetings.filter(m => new Date(m.scheduled_at) < now);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-7">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Mentor</p>
          <h1
            className="mt-1 text-3xl font-bold sm:text-4xl text-gradient-primary"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Welcome back, {displayName}
          </h1>
          <p className="text-muted-foreground mt-1.5">
            Track your mentees' startups, milestone progress, meetings, and recent sessions.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/assigned-startups">
              <Rocket className="h-3.5 w-3.5 text-primary" />All Startups
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/feedback">
              <MessageSquare className="h-3.5 w-3.5 text-success" />Feedback
            </Link>
          </Button>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Assigned Students" value={assignments.length} icon={Users} accent="primary" />
        <StatCard title="Active Startups"   value={startups.length}    icon={Rocket} accent="primary" />
        <StatCard title="Upcoming Meetings" value={upcomingMeetings.length} icon={CalendarDays} accent="warning" />
        <StatCard title="Cohort Progress"   value={`${overallPct}%`}   icon={TrendingUp} accent="success" />
      </div>

      {/* ── Booked Meetings ──────────────────────────────────────────────── */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> Booked Meetings
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Meetings scheduled by your assigned startups
            </p>
          </div>
          <div className="flex items-center gap-2">
            {upcomingMeetings.length > 0 && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                <Bell className="h-2.5 w-2.5 mr-1" />
                {upcomingMeetings.length} upcoming
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => refetchMeetings()}
              title="Refresh meetings"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {mLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : upcomingMeetings.length === 0 && pastMeetings.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-25" />
              <p className="text-sm">No meetings booked yet.</p>
              <p className="text-xs mt-1 opacity-70">When a startup books a session with you, it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-5">

              {/* Upcoming */}
              {upcomingMeetings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-1">
                    Upcoming
                  </p>
                  {upcomingMeetings.map(meeting => {
                    const { label, sub, isUrgent } = formatMeetingDate(meeting.scheduled_at);
                    const startup = startups.find(s => s.id === meeting.startup_id);
                    const studentProfile = startup
                      ? profileFor(startup.student_id)
                      : undefined;

                    return (
                      <div
                        key={meeting.id}
                        className={`rounded-xl border p-4 transition-all hover:shadow-sm ${
                          isUrgent
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border/60 bg-card/60 hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Date chip */}
                          <div className={`shrink-0 rounded-lg text-center px-3 py-2 min-w-[56px] ${
                            isUrgent ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                          }`}>
                            <p className="text-[10px] font-semibold uppercase leading-none">{label}</p>
                            <p className="text-xs mt-0.5 opacity-80">{sub}</p>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="font-semibold text-sm truncate">
                                {meeting.title || 'Mentorship Session'}
                              </p>
                              <div className="flex items-center gap-1.5">
                                {meeting.meeting_type === 'virtual' || meeting.meeting_link ? (
                                  <Badge variant="outline" className="text-[10px] gap-1 px-1.5">
                                    <Video className="h-2.5 w-2.5" /> Virtual
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] gap-1 px-1.5">
                                    <MapPin className="h-2.5 w-2.5" /> In-person
                                  </Badge>
                                )}
                                {meeting.status && (
                                  <Badge
                                    className={`text-[10px] px-1.5 ${
                                      meeting.status === 'confirmed'
                                        ? 'bg-success/10 text-success border-success/20'
                                        : 'bg-warning/10 text-warning border-warning/20'
                                    }`}
                                    variant="outline"
                                  >
                                    {meeting.status}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Startup + student */}
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              {startup && (
                                <>
                                  <Rocket className="h-3 w-3 shrink-0 text-primary" />
                                  <span className="font-medium text-foreground/80">{startup.name}</span>
                                  <span>·</span>
                                </>
                              )}
                              {studentProfile && (
                                <div className="flex items-center gap-1">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={studentProfile.avatar_url || undefined} />
                                    <AvatarFallback className="text-[8px]">
                                      {(studentProfile.full_name || '?').slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{studentProfile.full_name}</span>
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            {meeting.notes && (
                              <p className="text-xs text-muted-foreground line-clamp-1 italic">
                                {meeting.notes}
                              </p>
                            )}

                            {/* Join link */}
                            {meeting.meeting_link && (
                              <a
                                href={meeting.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                              >
                                <ExternalLink className="h-3 w-3" /> Join meeting
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Past */}
              {pastMeetings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-1">
                    Past
                  </p>
                  {pastMeetings.slice(0, 3).map(meeting => {
                    const startup = startups.find(s => s.id === meeting.startup_id);
                    const studentProfile = startup ? profileFor(startup.student_id) : undefined;
                    return (
                      <div
                        key={meeting.id}
                        className="rounded-xl border border-border/40 bg-muted/20 p-3 flex items-center gap-3 opacity-70"
                      >
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {meeting.title || 'Mentorship Session'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {startup?.name && `${startup.name} · `}
                            {new Date(meeting.scheduled_at).toLocaleDateString('en', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </p>
                        </div>
                        {studentProfile && (
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={studentProfile.avatar_url || undefined} />
                            <AvatarFallback className="text-[9px]">
                              {(studentProfile.full_name || '?').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                  {pastMeetings.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{pastMeetings.length - 3} more past meetings
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Cohort progress bar (segmented) ─────────────────────────────── */}
      {milestones.length > 0 && (() => {
        const pendingCount = milestones.filter(m => m.status === 'pending').length;
        const donePct = Math.round((completedMilestones / milestones.length) * 100);
        const inProgPct = Math.round((inProgressMilestones / milestones.length) * 100);
        const pendPct = 100 - donePct - inProgPct;
        return (
          <Card className="border-border/60 bg-card/80">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">Cohort milestone completion</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Across all mentees and startups</p>
                </div>
                <span className="text-2xl font-semibold tabular-nums" style={{ color: '#1D9E75' }}>{overallPct}%</span>
              </div>
              {/* Segmented track */}
              <div className="h-2.5 rounded-full overflow-hidden flex bg-muted/50">
                <div
                  className="h-full transition-all duration-700 ease-out"
                  style={{ width: `${donePct}%`, backgroundColor: '#1D9E75' }}
                />
                <div
                  className="h-full transition-all duration-700 ease-out"
                  style={{ width: `${inProgPct}%`, backgroundColor: '#D97706' }}
                />
                <div className="h-full flex-1" />
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: '#1D9E75' }} />
                  <span><span className="font-medium text-foreground">{completedMilestones}</span> completed</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: '#D97706' }} />
                  <span><span className="font-medium text-foreground">{inProgressMilestones}</span> in progress</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
                  <span><span className="font-medium text-foreground">{pendingCount}</span> pending</span>
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Mentee progress: custom horizontal bars ── */}
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Mentee Progress
              </CardTitle>
              <p className="text-xs text-muted-foreground">Milestone completion per student</p>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {menteeProgressData.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-14 shrink-0 text-right truncate" title={m.name}>
                    {m.name}
                  </span>
                  <div className="relative flex-1 h-7 rounded-md overflow-hidden" style={{ backgroundColor: 'rgba(128,128,128,0.15)' }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.max(m.progress, 4)}%`,
                        backgroundColor: '#7F77DD',
                        borderRadius: '6px',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#7F77DD', width: '32px', textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {m.progress}%
                  </span>
                </div>
              ))}
              {/* Legend */}
              <div className="flex gap-3 pt-1 text-[10px] text-muted-foreground border-t border-border/40 mt-1">
                <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded inline-block" style={{ backgroundColor: '#7F77DD' }} />Milestone completion</span>
              </div>
            </CardContent>
          </Card>

          {/* ── Stage radar: improved styling ── */}
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Startup Stage Radar
              </CardTitle>
              <p className="text-xs text-muted-foreground">Distribution of your mentees' startups</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                  <PolarGrid
                    gridType="polygon"
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.4}
                  />
                  <PolarAngleAxis
                    dataKey="stage"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                  />
                  <Radar
                    dataKey="count"
                    stroke="hsl(218 85% 42%)"
                    fill="hsl(218 85% 42%)"
                    fillOpacity={0.18}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'hsl(218 85% 42%)', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid hsl(var(--border))' }}
                    formatter={(v: any) => [`${v} startup${v !== 1 ? 's' : ''}`, '']}
                    labelStyle={{ fontWeight: 500 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
              {/* Stage legend with counts */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-muted-foreground border-t border-border/40 pt-3">
                {radarData.map(d => (
                  <span key={d.stage} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary/70 shrink-0" />
                    {d.stage}: <span className="font-medium text-foreground">{d.count}</span>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      )}

      {/* ── Mentees list ─────────────────────────────────────────────────── */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Your Mentees</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Click a student to view their full profile.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/assigned-startups">View all <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No approved assignments yet. An admin will assign students to you soon.</p>
            </div>
          )}
          {assignments.map(a => {
            const profile = profileFor(a.student_id);
            const studentStartups = startupsFor(a.student_id);
            const allMs = studentStartups.flatMap(s => milestonesFor(s.id));
            const done = allMs.filter(m => m.status === 'completed').length;
            const pct = allMs.length ? Math.round((done / allMs.length) * 100) : 0;

            // Any upcoming meeting for this student's startups
            const studentMeetings = upcomingMeetings.filter(m =>
              studentStartups.some(s => s.id === m.startup_id)
            );

            return (
              <div
                key={a.id}
                className="rounded-xl border border-border/60 bg-card/60 p-4 hover:border-primary/40 transition-all"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-11 w-11 ring-2 ring-primary/10">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(profile?.full_name || a.student_id).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Link
                        to={`/profile/${a.student_id}`}
                        className="font-semibold hover:text-primary transition-all truncate"
                      >
                        {profile?.full_name || 'Unnamed Student'}
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {profile?.department || profile?.headline || 'Student'}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{pct}%</Badge>
                        {studentMeetings.length > 0 && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                            <CalendarDays className="h-2.5 w-2.5 mr-0.5" />
                            {studentMeetings.length} meeting{studentMeetings.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {allMs.length > 0 && (
                      <div className="mt-2">
                        <Progress value={pct} className="h-1.5" />
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {done}/{allMs.length} milestones complete
                        </p>
                      </div>
                    )}

                    {studentStartups.length === 0 ? (
                      <p className="text-sm text-muted-foreground mt-2">No startup created yet.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {studentStartups.map(s => {
                          const pctS = progressFor(s.id);
                          const ms = milestonesFor(s.id);
                          const nextMeeting = upcomingMeetings.find(m => m.startup_id === s.id);
                          return (
                            <div key={s.id} className="rounded-lg bg-muted/40 p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Rocket className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <span className="font-medium text-sm truncate">{s.name}</span>
                                  <StageBadge stage={(s.stage as StartupStage) || 'idea'} />
                                </div>
                                <span className="text-xs font-semibold text-primary tabular-nums">{pctS}%</span>
                              </div>
                              <Progress value={pctS} className="h-1.5" />
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-success" />
                                  {ms.filter(m => m.status === 'completed').length} done
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-warning" />
                                  {ms.filter(m => m.status === 'in-progress').length} in progress
                                </span>
                                <span className="flex items-center gap-1">
                                  <Circle className="h-3 w-3" />
                                  {ms.filter(m => m.status === 'pending').length} pending
                                </span>
                                {nextMeeting && (
                                  <span className="flex items-center gap-1 text-primary font-medium ml-auto">
                                    <CalendarDays className="h-3 w-3" />
                                    {formatMeetingDate(nextMeeting.scheduled_at).label}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Recent Feedback ──────────────────────────────────────────────── */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Recent Feedback
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
            <Link to="/feedback">Log session <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
              No mentorship sessions logged yet.
            </div>
          )}
          {sessions.map(record => {
            const startup = startups.find(s => s.id === record.startup_id);
            return (
              <div
                key={record.id}
                className="rounded-lg border border-border/60 p-3 space-y-1.5 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{startup?.name || 'Unknown startup'}</span>
                  <span className="text-xs text-muted-foreground">
                    {record.session_date
                      ? new Date(record.session_date).toLocaleDateString('en', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })
                      : ''}
                  </span>
                </div>
                {record.feedback && (
                  <p className="text-sm text-foreground/70 italic border-l-2 border-primary/30 pl-3">
                    "{record.feedback}"
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

    </div>
  );
}