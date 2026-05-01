import { useState } from 'react';
import {
  CheckCircle2, Circle, Clock, Plus, Target, Flame,
  Calendar, Rocket, ChevronRight, LayoutGrid, List,
  Trophy, Zap, TrendingUp, ArrowUpRight, Filter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyStartups } from '@/hooks/use-startups';
import { useMilestonesByStartups, useCreateMilestone, useUpdateMilestone } from '@/hooks/use-milestones';

/* ── Status config ───────────────────────────────────────────── */
const STATUS = {
  completed: {
    icon: CheckCircle2,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.25)',
    label: 'Completed',
    next: 'pending' as const,
  },
  'in-progress': {
    icon: Clock,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
    label: 'In Progress',
    next: 'completed' as const,
  },
  pending: {
    icon: Circle,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.08)',
    border: 'rgba(148,163,184,0.15)',
    label: 'Pending',
    next: 'in-progress' as const,
  },
} as const;

type Status = keyof typeof STATUS;

/* ── Stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number | string; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/6 bg-white/[0.025] p-4">
      <div className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full blur-2xl" style={{ background: color + '30' }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">{label}</p>
          <p className="mt-1 text-2xl font-black text-white leading-none">{value}</p>
          {sub && <p className="mt-1 text-[11px] text-white/30">{sub}</p>}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: color + '20' }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

/* ── Milestone row (list view) ───────────────────────────────── */
function MilestoneRow({ milestone, startup, onCycle }: {
  milestone: any; startup: any; onCycle: () => void;
}) {
  const st = (milestone.status as Status) || 'pending';
  const cfg = STATUS[st] ?? STATUS.pending;
  const Icon = cfg.icon;
  const isOverdue = milestone.due_date && new Date(milestone.due_date) < new Date() && st !== 'completed';

  return (
    <div
      className="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3.5 cursor-pointer transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04]"
      onClick={onCycle}
      title="Click to advance status"
    >
      {/* Status icon */}
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-sm font-semibold leading-snug ${st === 'completed' ? 'line-through text-white/30' : 'text-white'}`}>
            {milestone.title}
          </p>
          <span
            className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
          >
            {cfg.label}
          </span>
          {startup && (
            <span className="flex items-center gap-1 text-[10px] text-white/25">
              <Rocket className="h-2.5 w-2.5" /> {startup.name}
            </span>
          )}
        </div>
        {milestone.description && (
          <p className="mt-1 text-xs text-white/35 line-clamp-1">{milestone.description}</p>
        )}
        {milestone.due_date && (
          <p className={`mt-1 flex items-center gap-1 text-[11px] ${isOverdue ? 'text-red-400' : 'text-white/25'}`}>
            <Calendar className="h-3 w-3" />
            {isOverdue ? 'Overdue · ' : ''}
            {new Date(milestone.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Advance hint */}
      <div className="flex shrink-0 items-center gap-1 text-[10px] text-white/15 group-hover:text-white/30 transition-colors mt-0.5">
        <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

/* ── Milestone card (grid view) ──────────────────────────────── */
function MilestoneCard({ milestone, startup, onCycle }: {
  milestone: any; startup: any; onCycle: () => void;
}) {
  const st = (milestone.status as Status) || 'pending';
  const cfg = STATUS[st] ?? STATUS.pending;
  const Icon = cfg.icon;
  const isOverdue = milestone.due_date && new Date(milestone.due_date) < new Date() && st !== 'completed';

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 cursor-pointer transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04]"
      onClick={onCycle}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: cfg.color + '20' }} />

      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          <Icon className="h-4 w-4" style={{ color: cfg.color }} />
        </div>
        <span
          className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
        >
          {cfg.label}
        </span>
      </div>

      <p className={`text-sm font-bold leading-snug mb-1 ${st === 'completed' ? 'line-through text-white/30' : 'text-white'}`}>
        {milestone.title}
      </p>
      {milestone.description && (
        <p className="text-xs text-white/30 line-clamp-2 mb-2">{milestone.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        {startup && (
          <span className="flex items-center gap-1 text-[10px] text-white/25">
            <Rocket className="h-2.5 w-2.5" /> {startup.name}
          </span>
        )}
        {milestone.due_date && (
          <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-red-400' : 'text-white/25'}`}>
            <Calendar className="h-3 w-3" />
            {new Date(milestone.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function Milestones() {
  const { data: startups = [], isLoading: sl } = useMyStartups();
  const startupIds = startups.map(s => s.id);
  const { data: milestones = [], isLoading: ml } = useMilestonesByStartups(startupIds);
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedStartup, setSelectedStartup] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Status>('all');
  const [filterStartup, setFilterStartup] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const total       = milestones.length;
  const completed   = milestones.filter(m => m.status === 'completed').length;
  const inProgress  = milestones.filter(m => m.status === 'in-progress').length;
  const pending     = milestones.filter(m => m.status === 'pending').length;
  const pct         = total ? Math.round((completed / total) * 100) : 0;
  const overdueCount = milestones.filter(m =>
    m.due_date && new Date(m.due_date) < new Date() && m.status !== 'completed'
  ).length;

  const filtered = milestones.filter(m => {
    const statusOk  = filterStatus === 'all' || m.status === filterStatus;
    const startupOk = filterStartup === 'all' || m.startup_id === filterStartup;
    return statusOk && startupOk;
  });

  const handleCreate = async () => {
    if (!title.trim() || !selectedStartup) return;
    await createMilestone.mutateAsync({
      startup_id: selectedStartup,
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate || undefined,
    });
    setTitle(''); setDescription(''); setDueDate(''); setOpen(false);
  };

  const cycleStatus = (m: typeof milestones[0]) => {
    const st = (m.status as Status) || 'pending';
    updateMilestone.mutate({
      startup_id: m.startup_id!,
      milestone_id: m.id,
      status: STATUS[st]?.next ?? 'in-progress',
    });
  };

  if (sl || ml) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 px-1 pb-10">

      {/* ── HERO HEADER ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5">
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-600/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-16 h-24 w-24 rounded-full bg-indigo-600/10 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-300">
              <Flame className="h-3 w-3" /> Milestone Tracker
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Milestones</h1>
            <p className="mt-1 text-sm text-white/40">Click any milestone to advance its status.</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={startups.length === 0}
                className="gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 shadow-lg shadow-emerald-500/20 shrink-0"
              >
                <Plus className="h-4 w-4" /> Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent className="border-white/8 bg-[#0d1117]">
              <DialogHeader>
                <DialogTitle className="text-white">New Milestone</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Startup</label>
                  <Select value={selectedStartup} onValueChange={setSelectedStartup}>
                    <SelectTrigger className="bg-white/[0.04] border-white/8 text-white">
                      <SelectValue placeholder="Pick a startup" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1117] border-white/8">
                      {startups.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Title</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Complete MVP"
                    className="bg-white/[0.04] border-white/8 text-white placeholder:text-white/20 focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Description</label>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What needs to happen..."
                    className="bg-white/[0.04] border-white/8 text-white placeholder:text-white/20 focus:border-emerald-500/50 resize-none"
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Due Date</label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="bg-white/[0.04] border-white/8 text-white focus:border-emerald-500/50"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createMilestone.isPending || !title.trim() || !selectedStartup}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 font-semibold"
                >
                  {createMilestone.isPending ? 'Creating…' : 'Create Milestone'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── STATS ROW ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total"       value={total}      icon={Target}      color="#6366f1" sub="milestones" />
        <StatCard label="Completed"   value={completed}  icon={Trophy}      color="#10b981" sub={`${pct}% done`} />
        <StatCard label="In Progress" value={inProgress} icon={Zap}         color="#f59e0b" sub="active now" />
        <StatCard label="Overdue"     value={overdueCount} icon={TrendingUp} color={overdueCount > 0 ? '#ef4444' : '#94a3b8'} sub="need attention" />
      </div>

      {/* ── PROGRESS BANNER ──────────────────────────────────── */}
      {total > 0 && (
        <div className="flex items-center gap-5 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <CircularProgress value={pct} size={88} strokeWidth={7} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-white">Overall Progress</p>
              <span className="text-sm font-black text-emerald-400">{completed}/{total}</span>
            </div>
            {/* Segmented bar */}
            <div className="flex h-2 overflow-hidden rounded-full bg-white/5 gap-0.5">
              {completed   > 0 && <div className="rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${(completed/total)*100}%` }} />}
              {inProgress  > 0 && <div className="rounded-full bg-amber-500  transition-all duration-700" style={{ width: `${(inProgress/total)*100}%` }} />}
              {pending     > 0 && <div className="rounded-full bg-white/10   transition-all duration-700" style={{ width: `${(pending/total)*100}%` }} />}
            </div>
            <div className="mt-2 flex gap-4 text-[11px] text-white/30">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{completed} done</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500"  />{inProgress} active</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white/20"  />{pending} pending</span>
            </div>
          </div>
        </div>
      )}

      {/* ── FILTERS + VIEW TOGGLE ────────────────────────────── */}
      {total > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-white/25 shrink-0" />

          {/* Status filters */}
          {(['all', 'pending', 'in-progress', 'completed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                filterStatus === s
                  ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                  : 'border-white/5 bg-white/[0.02] text-white/30 hover:border-white/10 hover:text-white/50'
              }`}
            >
              {s === 'in-progress' ? 'Active' : s}
            </button>
          ))}

          {/* Startup filter */}
          {startups.length > 1 && (
            <Select value={filterStartup} onValueChange={setFilterStartup}>
              <SelectTrigger className="h-8 w-auto min-w-[120px] rounded-lg border-white/5 bg-white/[0.02] text-[11px] font-bold text-white/30 px-3">
                <SelectValue placeholder="All startups" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1117] border-white/8">
                <SelectItem value="all">All startups</SelectItem>
                {startups.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {/* View toggle */}
          <div className="ml-auto flex gap-1 rounded-lg border border-white/5 bg-white/[0.02] p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md p-1.5 transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/25 hover:text-white/50'}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/25 hover:text-white/50'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── EMPTY STATE ──────────────────────────────────────── */}
      {milestones.length === 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-full bg-emerald-600/8 blur-3xl" />
          </div>
          <div className="relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
              <Target className="h-7 w-7 text-white/15" />
            </div>
            <p className="font-bold text-white/50">No milestones yet</p>
            <p className="mt-1 text-sm text-white/25">
              {startups.length === 0 ? 'Create a startup first, then add milestones.' : 'Hit "Add Milestone" to get started.'}
            </p>
          </div>
        </div>
      )}

      {/* ── MILESTONE LIST / GRID ─────────────────────────────── */}
      {filtered.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">
          {filtered.map(m => (
            <MilestoneRow
              key={m.id}
              milestone={m}
              startup={startups.find(s => s.id === m.startup_id)}
              onCycle={() => cycleStatus(m)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(m => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              startup={startups.find(s => s.id === m.startup_id)}
              onCycle={() => cycleStatus(m)}
            />
          ))}
        </div>
      )}

      {/* No results after filter */}
      {milestones.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] py-10 text-center text-sm text-white/25">
          No milestones match your filters.
        </div>
      )}
    </div>
  );
}