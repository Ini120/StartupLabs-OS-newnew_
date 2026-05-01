import { useState } from 'react';
import {
  MessageSquare, Calendar, Rocket, Clock, ChevronRight, BookOpen,
  PenLine, Save, Loader2, CheckCircle2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAllStartups } from '@/hooks/use-startups';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

/* ─── helpers ──────────────────────────────────────────────── */
function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByMonth(records: any[]) {
  const groups: Record<string, any[]> = {};
  records.forEach(r => {
    const d = new Date(r.session_date || r.scheduled_at || r.created_at);
    const key = d.toLocaleDateString('en', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return groups;
}

/* ─── Inline Notes Editor ─────────────────────────────────── */
/**
 * Used on both logged MentorshipRecords AND on past meetings
 * (which get promoted into a MentorshipRecord when feedback is saved).
 */
function NotesEditor({
  recordId,
  meetingId,
  startupId,
  mentorId,
  sessionDate,
  initialFeedback,
  onSaved,
}: {
  recordId?: string;         // existing MentorshipRecord id
  meetingId?: string;        // source meeting id (for new records)
  startupId: string;
  mentorId: string;
  sessionDate: string;
  initialFeedback: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initialFeedback);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    if (recordId) {
      // Update existing record
      await supabase
        .from('MentorshipRecords')
        .update({ feedback: text, updated_at: new Date().toISOString() })
        .eq('id', recordId);
    } else {
      // Create new record from meeting
      await supabase.from('MentorshipRecords').insert({
        mentor_id: mentorId,
        startup_id: startupId,
        session_date: sessionDate,
        feedback: text,
        meeting_id: meetingId ?? null,
      });
    }
    setSaving(false);
    setSaved(true);
    onSaved();
    setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
  };

  return (
    <div className="border-t border-border/40">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-medium hover:bg-muted/30 transition-colors"
        style={{ color: '#7F77DD' }}
      >
        <span className="flex items-center gap-1.5">
          <PenLine className="h-3 w-3" />
          {initialFeedback ? 'Edit notes' : 'Add session notes'}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2.5">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What was discussed? Key takeaways, action items, next steps…"
            rows={4}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
            style={{ '--tw-ring-color': '#7F77DD40' } as any}
          />
          <div className="flex items-center gap-2 justify-end">
            {saved && (
              <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved!
              </span>
            )}
            <Button
              size="sm"
              className="gap-1.5 h-8 text-xs"
              style={{ backgroundColor: '#7F77DD', color: '#fff' }}
              onClick={handleSave}
              disabled={saving || saved}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? 'Saving…' : 'Save Notes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Session Card ────────────────────────────────────────── */
function SessionCard({
  record,
  startup,
  mentorId,
  onSaved,
  sourceType,
}: {
  record: any;
  startup: any;
  mentorId: string;
  onSaved: () => void;
  sourceType: 'log' | 'meeting';
}) {
  const sessionDate = record.session_date || record.scheduled_at || record.created_at;

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 overflow-hidden hover:border-border transition-colors">
      {/* Card header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(127,119,221,0.12)' }}
          >
            <Rocket className="h-3.5 w-3.5" style={{ color: '#7F77DD' }} />
          </div>
          <span className="font-semibold text-sm truncate">
            {startup?.name || 'Unknown Startup'}
          </span>
          {sourceType === 'meeting' && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-indigo-500/30 text-indigo-500 shrink-0">
              Meeting
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {sessionDate
              ? new Date(sessionDate).toLocaleDateString('en', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })
              : '—'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {sessionDate ? timeAgo(sessionDate) : ''}
          </span>
        </div>
      </div>

      {/* Meeting extra info */}
      {sourceType === 'meeting' && record.title && (
        <div className="px-4 pt-2.5 pb-1">
          <p className="text-[11px] font-semibold text-muted-foreground">{record.title}</p>
        </div>
      )}

      {/* Feedback body */}
      {record.feedback ? (
        <div className="px-4 py-3">
          <p
            className="text-[11px] font-medium mb-1.5 flex items-center gap-1.5"
            style={{ color: '#7F77DD' }}
          >
            <MessageSquare className="h-3 w-3" /> Session notes
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">{record.feedback}</p>
        </div>
      ) : (
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground italic">No notes recorded yet.</p>
        </div>
      )}

      {/* Inline notes editor */}
      <NotesEditor
        recordId={sourceType === 'log' ? record.id : undefined}
        meetingId={sourceType === 'meeting' ? record.id : undefined}
        startupId={record.startup_id}
        mentorId={mentorId}
        sessionDate={sessionDate}
        initialFeedback={record.feedback ?? ''}
        onSaved={onSaved}
      />
    </div>
  );
}

/* ─── Main Feedback Page ──────────────────────────────────── */
export default function Feedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: startups = [] } = useAllStartups();

  // Logged mentorship records
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['mentorships', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('MentorshipRecords')
        .select('*')
        .eq('mentor_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Past meetings (completed sessions not yet in MentorshipRecords)
  const { data: pastMeetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['mentor-past-meetings-feedback', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('mentor_id', user!.id)
        .lt('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const isLoading = recordsLoading || meetingsLoading;

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['mentorships', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['mentor-past-meetings-feedback', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['mentor-sessions', user?.id] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Meeting ids already covered by records (via meeting_id foreign key)
  const coveredMeetingIds = new Set(records.map((r: any) => r.meeting_id).filter(Boolean));

  // Past meetings that don't yet have a MentorshipRecord → shown as "unsaved" sessions
  const unloggedMeetings = pastMeetings.filter(m => !coveredMeetingIds.has(m.id));

  // Merge all items with a unified sort key
  const allItems = [
    ...records.map(r => ({ ...r, _type: 'log' as const, _sortDate: r.session_date || r.created_at })),
    ...unloggedMeetings.map(m => ({ ...m, _type: 'meeting' as const, _sortDate: m.scheduled_at })),
  ].sort((a, b) => new Date(b._sortDate).getTime() - new Date(a._sortDate).getTime());

  const totalSessions = records.length;
  const uniqueStartups = new Set(records.map(r => r.startup_id)).size;
  const totalMeetings = pastMeetings.length;

  const grouped = groupByMonth(allItems);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#7F77DD' }}>
            Mentor
          </p>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Feedback & Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your mentorship session logs, meeting history, and notes.
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5 shrink-0" style={{ backgroundColor: '#7F77DD', color: '#fff' }}>
          <Link to="/assigned-startups">
            <BookOpen className="h-3.5 w-3.5" /> Log new session
          </Link>
        </Button>
      </div>

      {/* Summary stats */}
      {(records.length > 0 || pastMeetings.length > 0) && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-3">
            <p className="text-xs text-muted-foreground">Total logs</p>
            <p className="text-2xl font-semibold mt-0.5 tabular-nums" style={{ color: '#7F77DD' }}>
              {totalSessions}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-3">
            <p className="text-xs text-muted-foreground">Past meetings</p>
            <p className="text-2xl font-semibold mt-0.5 tabular-nums" style={{ color: '#7F77DD' }}>
              {totalMeetings}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-3">
            <p className="text-xs text-muted-foreground">Startups mentored</p>
            <p className="text-2xl font-semibold mt-0.5 tabular-nums" style={{ color: '#7F77DD' }}>
              {uniqueStartups}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {allItems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: 'rgba(127,119,221,0.1)' }}
            >
              <MessageSquare className="h-7 w-7" style={{ color: '#7F77DD' }} />
            </div>
            <p className="font-medium text-foreground">No sessions or meetings yet</p>
            <p className="text-sm mt-1 text-center max-w-xs">
              When students book meetings with you, they'll appear here. You can also log sessions manually.
            </p>
            <Button asChild size="sm" className="mt-4 gap-1.5" style={{ backgroundColor: '#7F77DD', color: '#fff' }}>
              <Link to="/assigned-startups">
                View startups <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grouped sessions */}
      {Object.entries(grouped).map(([month, monthItems]) => (
        <div key={month} className="space-y-3">
          {/* Month divider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {month}
            </span>
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground">
              {monthItems.length} item{monthItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-2.5">
            {monthItems.map(item => {
              const startup = startups.find(s => s.id === item.startup_id);
              return (
                <SessionCard
                  key={`${item._type}-${item.id}`}
                  record={item}
                  startup={startup}
                  mentorId={user!.id}
                  onSaved={handleSaved}
                  sourceType={item._type}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}