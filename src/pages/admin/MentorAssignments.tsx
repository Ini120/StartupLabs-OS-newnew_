import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@clerk/clerk-react';
import {
  CheckCircle2, XCircle, Clock, ArrowRight,
  Search, RefreshCw, UserCheck, Loader2, CalendarDays,
} from 'lucide-react';

/* ── status config ───────────────────────────────────────────── */
const STATUS = {
  pending:  { label: 'Pending',  bg: 'bg-amber-500/10',   text: 'text-amber-600',   border: 'border-amber-500/20',  icon: Clock },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-red-500/10',     text: 'text-red-500',     border: 'border-red-500/20',    icon: XCircle },
} as const;
type StatusKey = keyof typeof STATUS;

/* ── stat card ───────────────────────────────────────────────── */
function StatCard({ status, count }: { status: StatusKey; count: number }) {
  const cfg = STATUS[status];
  const Icon = cfg.icon;
  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
          <Icon className={`h-5 w-5 ${cfg.text}`} />
        </div>
        <div>
          <p className="text-2xl font-black tabular-nums leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
            {count}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">{cfg.label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── status badge ────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS[status as StatusKey] ?? STATUS.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`${cfg.bg} ${cfg.text} ${cfg.border} text-[10px] gap-1 font-semibold`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

/* ── assignment card ─────────────────────────────────────────── */
function AssignmentCard({
  assignment, mentorProfile, studentProfile, mentors, allProfiles, onUpdate, isUpdating,
}: {
  assignment: any; mentorProfile?: any; studentProfile?: any;
  mentors: any[]; allProfiles: any[];
  onUpdate: (id: string, updates: Record<string, any>) => void;
  isUpdating: boolean;
}) {
  const [localStatus, setLocalStatus] = useState<string>(assignment.status);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handle = async (updates: Record<string, any>) => {
    const key = updates.status ?? 'reassign';
    setLoadingAction(key);
    try {
      await onUpdate(assignment.id, updates);
      if (updates.status) setLocalStatus(updates.status);
    } finally {
      setLoadingAction(null);
    }
  };

  const getName = (uid: string) => {
    const p = allProfiles.find((p: any) => p.user_id === uid);
    return p?.full_name || uid.slice(0, 8) + '…';
  };

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const cardBorder =
    localStatus === 'approved' ? 'border-emerald-500/20 bg-emerald-500/5' :
    localStatus === 'rejected' ? 'border-red-500/20 bg-red-500/5 opacity-70' :
    'border-border/60 bg-card/80 hover:border-primary/20';

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${cardBorder}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">

        {/* Student */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 ring-2 ring-violet-500/15 shrink-0">
            <AvatarImage src={studentProfile?.avatar_url} />
            <AvatarFallback className="text-xs bg-violet-500/10 text-violet-600 font-semibold">
              {initials(studentProfile?.full_name || 'S')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Student</p>
            <p className="text-sm font-semibold truncate">{studentProfile?.full_name || 'Unknown'}</p>
            <p className="text-[11px] text-muted-foreground truncate">{studentProfile?.email || '—'}</p>
          </div>
        </div>

        <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground/30 shrink-0" />

        {/* Mentor */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 ring-2 ring-primary/15 shrink-0">
            <AvatarImage src={mentorProfile?.avatar_url} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {initials(mentorProfile?.full_name || 'M')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Mentor</p>
            <p className="text-sm font-semibold truncate">{mentorProfile?.full_name || 'Unknown'}</p>
            <p className="text-[11px] text-muted-foreground truncate">{mentorProfile?.email || '—'}</p>
          </div>
        </div>

        {/* Status + actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <StatusBadge status={localStatus} />

          {/* Reassign mentor */}
          <Select
            value={assignment.mentor_id}
            onValueChange={(newMentorId) => {
              if (newMentorId !== assignment.mentor_id) {
                handle({ mentor_id: newMentorId, status: 'pending' });
              }
            }}
            disabled={isUpdating}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Reassign…" />
            </SelectTrigger>
            <SelectContent>
              {mentors.map((m: any) => (
                <SelectItem key={m.user_id} value={m.user_id} className="text-xs">
                  {getName(m.user_id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Approve button */}
          {localStatus !== 'approved' && (
            <Button
              size="sm"
              className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              onClick={() => handle({ status: 'approved' })}
              disabled={isUpdating}
            >
              {loadingAction === 'approved'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <CheckCircle2 className="h-3.5 w-3.5" />}
              Approve
            </Button>
          )}

          {/* Reject / Revoke */}
          {localStatus !== 'rejected' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-xs border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600"
              onClick={() => handle({ status: 'rejected' })}
              disabled={isUpdating}
            >
              {loadingAction === 'rejected'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <XCircle className="h-3.5 w-3.5" />}
              {localStatus === 'approved' ? 'Revoke' : 'Reject'}
            </Button>
          )}

          {/* Re-approve after rejection */}
          {localStatus === 'rejected' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              onClick={() => handle({ status: 'approved' })}
              disabled={isUpdating}
            >
              {loadingAction === 'approved'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <CheckCircle2 className="h-3.5 w-3.5" />}
              Re-approve
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
        <CalendarDays className="h-3 w-3" />
        Requested{' '}
        {assignment.created_at
          ? new Date(assignment.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function MentorAssignments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | StatusKey>('all');

  /* ── queries ───────────────────────────────────────────────── */
  const { data: assignments = [], isLoading: al, refetch } = useQuery({
    queryKey: ['mentor-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_assignments').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['all-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const mentors = (roles as any[]).filter(r => r.role === 'mentor');
  const profileFor = (uid: string) => (profiles as any[]).find(p => p.user_id === uid);

  /* ── mutation ──────────────────────────────────────────────── */
  const updateAssignment = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated — please sign in again.');
      const { data, error } = await supabase.functions.invoke('manage-assignment', {
        body: { assignment_id: id, ...updates },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-assignments-count'] });
      toast({ title: 'Assignment updated' });
    },
    onError: (err: any) => {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    },
  });

  /* ── filtered list ─────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = filter === 'all'
      ? (assignments as any[])
      : (assignments as any[]).filter(a => a.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => {
        const s = profileFor(a.student_id);
        const m = profileFor(a.mentor_id);
        return (
          s?.full_name?.toLowerCase().includes(q) ||
          m?.full_name?.toLowerCase().includes(q) ||
          s?.email?.toLowerCase().includes(q) ||
          m?.email?.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [assignments, filter, search, profiles]);

  const counts = {
    all:      (assignments as any[]).length,
    pending:  (assignments as any[]).filter(a => a.status === 'pending').length,
    approved: (assignments as any[]).filter(a => a.status === 'approved').length,
    rejected: (assignments as any[]).filter(a => a.status === 'rejected').length,
  };

  /* ── loading skeleton ──────────────────────────────────────── */
  if (al) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="space-y-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Mentor Assignments
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review, approve, reject, or reassign student–mentor pairings.
          </p>
        </div>
        <Button
          variant="ghost" size="sm"
          className="h-8 w-8 p-0 shrink-0"
          onClick={() => refetch()}
          title="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard status="pending"  count={counts.pending} />
        <StatCard status="approved" count={counts.approved} />
        <StatCard status="rejected" count={counts.rejected} />
      </div>

      {/* ── Filter tabs + Search ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 flex-wrap">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
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
              <span className={`tabular-nums text-[10px] ${filter === tab ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs sm:ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* ── Assignment list ─────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">
            {search
              ? `No results for "${search}"`
              : filter === 'pending'
              ? 'All caught up — no pending assignments.'
              : `No ${filter} assignments.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              mentorProfile={profileFor(a.mentor_id)}
              studentProfile={profileFor(a.student_id)}
              mentors={mentors}
              allProfiles={profiles as any[]}
              onUpdate={(id, updates) => updateAssignment.mutate({ id, updates })}
              isUpdating={updateAssignment.isPending}
            />
          ))}
        </div>
      )}

    </div>
  );
}