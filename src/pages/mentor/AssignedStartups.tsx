import { Link } from 'react-router-dom';
import {
  Rocket, Target, MessageSquare, ExternalLink, Calendar,
  CheckCircle2, Clock, Circle, ChevronDown, ChevronUp, Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { StageBadge } from '@/components/shared/Stagebadge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMentorRealtime } from '@/hooks/use-mentor-realtime';
import { useState } from 'react';
import type { StartupStage } from '@/types';

const STATUS_CONFIG = {
  completed:    { icon: CheckCircle2, color: '#1D9E75', bg: 'rgba(29,158,117,0.08)', label: 'Completed' },
  'in-progress':{ icon: Clock,        color: '#7F77DD', bg: 'rgba(127,119,221,0.08)', label: 'In Progress' },
  pending:      { icon: Circle,       color: '#9ca3af', bg: 'rgba(156,163,175,0.08)', label: 'Pending' },
};

function MilestoneRow({ m }: { m: any }) {
  const cfg = STATUS_CONFIG[m.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/30"
      style={{ borderLeft: `2px solid ${cfg.color}22` }}>
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.color }} />
        <span className="text-sm truncate">{m.title || 'Untitled milestone'}</span>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        {m.due_date && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(m.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </span>
        )}
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ color: cfg.color, backgroundColor: cfg.bg }}
        >
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

function StartupCard({ s, ms, studentId }: { s: any; ms: any[]; studentId: string }) {
  const [expanded, setExpanded] = useState(true);
  const completed = ms.filter(m => m.status === 'completed').length;
  const inProgress = ms.filter(m => m.status === 'in-progress').length;
  const pending = ms.filter(m => m.status === 'pending').length;
  const pct = ms.length === 0 ? 0 : Math.round((completed / ms.length) * 100);

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
      {/* Startup header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(127,119,221,0.12)' }}>
            <Rocket className="h-4.5 w-4.5" style={{ color: '#7F77DD' }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{s.name}</span>
              <StageBadge stage={(s.stage as StartupStage) || 'idea'} />
            </div>
            {s.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progress</span>
          <span className="font-medium tabular-nums" style={{ color: '#7F77DD' }}>
            {completed}/{ms.length} milestones · {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(127,119,221,0.12)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: '#7F77DD' }}
          />
        </div>
        {/* Mini stats */}
        <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" style={{ color: '#1D9E75' }} />{completed} done
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" style={{ color: '#7F77DD' }} />{inProgress} active
          </span>
          <span className="flex items-center gap-1">
            <Circle className="h-3 w-3 text-muted-foreground/50" />{pending} pending
          </span>
        </div>
      </div>

      {/* Milestones list */}
      {expanded && ms.length > 0 && (
        <div className="border-t border-border/40 px-3 py-2 space-y-0.5">
          <p className="text-[11px] font-medium text-muted-foreground px-1 pt-1 pb-1.5 flex items-center gap-1.5">
            <Target className="h-3 w-3" /> Milestones
          </p>
          {ms.map(m => <MilestoneRow key={m.id} m={m} />)}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3 border-t border-border/40 bg-muted/20">
        <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1.5">
          <Link to={`/messages?to=${studentId}`}>
            <MessageSquare className="h-3 w-3" /> Message
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to="/feedback">Log feedback</Link>
        </Button>
      </div>
    </div>
  );
}

export default function AssignedStartups() {
  const { user } = useAuth();
  useMentorRealtime(user?.id);

  const { data: assignments = [], isLoading: aLoading } = useQuery({
    queryKey: ['mentor-assignments', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_assignments').select('*')
        .eq('mentor_id', user!.id).eq('status', 'approved');
      if (error) throw error;
      return data ?? [];
    },
  });

  const studentIds = assignments.map(a => a.student_id);

  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['mentor-student-profiles', studentIds.join(',')],
    enabled: studentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').in('user_id', studentIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: startups = [], isLoading: sLoading } = useQuery({
    queryKey: ['mentor-student-startups', studentIds.join(',')],
    enabled: studentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('Startups').select('*').in('student_id', studentIds);
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
        .from('Milestones').select('*').in('startup_id', startupIds)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (aLoading || sLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        {[1, 2].map(i => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  const profileFor = (uid: string) => studentProfiles.find(p => p.user_id === uid);
  const milestonesFor = (sid: string) => milestones.filter(m => m.startup_id === sid);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#7F77DD' }}>
            Mentor
          </p>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Assigned Students
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Detailed view of every mentee's startup, stage, and milestone progress.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 gap-1.5 px-3 py-1.5 text-sm">
          <Users className="h-3.5 w-3.5" />
          {assignments.length} mentee{assignments.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Empty state */}
      {assignments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: 'rgba(127,119,221,0.1)' }}>
              <Rocket className="h-7 w-7" style={{ color: '#7F77DD' }} />
            </div>
            <p className="font-medium text-foreground">No students assigned yet</p>
            <p className="text-sm mt-1">An admin will pair you with mentees soon.</p>
          </CardContent>
        </Card>
      )}

      {/* Mentee cards */}
      <div className="space-y-6">
        {assignments.map(a => {
          const profile = profileFor(a.student_id);
          const studentStartups = startups.filter(s => s.student_id === a.student_id);
          const allMs = studentStartups.flatMap(s => milestonesFor(s.id));
          const overallPct = allMs.length
            ? Math.round((allMs.filter(m => m.status === 'completed').length / allMs.length) * 100)
            : 0;

          return (
            <Card key={a.id} className="overflow-hidden border-border/60">
              {/* Student header */}
              <CardHeader className="p-5 pb-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 ring-2 shrink-0" style={{ '--tw-ring-color': 'rgba(127,119,221,0.25)' } as any}>
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback
                      className="font-semibold text-sm"
                      style={{ backgroundColor: 'rgba(127,119,221,0.12)', color: '#7F77DD' }}
                    >
                      {(profile?.full_name || a.student_id).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-base leading-tight">
                          {profile?.full_name || 'Unnamed Student'}
                        </h2>
                        {profile?.headline && (
                          <p className="text-sm text-muted-foreground mt-0.5">{profile.headline}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {profile?.department && (
                            <span className="text-[11px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                              {profile.department}
                            </span>
                          )}
                          {profile?.level && (
                            <span className="text-[11px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                              {profile.level}
                            </span>
                          )}
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-md font-medium"
                            style={{ backgroundColor: 'rgba(127,119,221,0.1)', color: '#7F77DD' }}
                          >
                            {overallPct}% overall
                          </span>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm" className="shrink-0 h-8 text-xs gap-1.5">
                        <Link to={`/profile/${a.student_id}`}>
                          Profile <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Startups */}
              <CardContent className="p-4 space-y-3">
                {studentStartups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No startup created yet.
                  </p>
                ) : (
                  studentStartups.map(s => (
                    <StartupCard
                      key={s.id}
                      s={s}
                      ms={milestonesFor(s.id)}
                      studentId={a.student_id}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}