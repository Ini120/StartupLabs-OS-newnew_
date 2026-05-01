import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Rocket, Plus, Calendar, Trash2, User, TrendingUp, Target, Zap,
  CheckCircle2, Clock, BarChart3, ArrowUpRight, Sparkles, Users,
  UserPlus, GitMerge, UserCheck, BookmarkPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StageBadge } from '@/components/shared/Stagebadge';
import { useMyStartups, useCreateStartup, useDeleteStartup } from '@/hooks/use-startups';
import { useMilestonesByStartups } from '@/hooks/use-milestones';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/* ─── Profile-startups hook (persistent, with remove) ───────── */
function useProfileStartups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pending, setPending] = useState<string | null>(null);

  // Fetch which startup_ids are already on the profile
  const { data: profileStartupIds = new Set<string>() } = useQuery({
    queryKey: ['profile-startup-ids', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_startups')
        .select('startup_id')
        .eq('user_id', user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.startup_id as string));
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['profile-startup-ids', user?.id] });

  const addToProfile = async (startup: any) => {
    if (!user) return;
    setPending(startup.id);
    try {
      const { error } = await supabase.from('profile_startups').upsert(
        {
          user_id:     user.id,
          startup_id:  startup.id,
          name:        startup.name,
          description: startup.description ?? null,
          stage:       startup.stage ?? null,
          founded_at:  startup.created_at ?? null,
          website_url: startup.website_url ?? null,
          logo_url:    startup.logo_url ?? null,
          industry:    startup.industry ?? null,
        },
        { onConflict: 'user_id,startup_id' }
      );
      if (error) throw error;
      invalidate();
      toast({
        title: '🚀 Added to profile!',
        description: `${startup.name} is now visible on your profile page.`,
      });
    } catch (err: any) {
      toast({ title: 'Failed to add', description: err.message, variant: 'destructive' });
    } finally {
      setPending(null);
    }
  };

  const removeFromProfile = async (startup: any) => {
    if (!user) return;
    setPending(startup.id);
    try {
      const { error } = await supabase
        .from('profile_startups')
        .delete()
        .eq('user_id', user.id)
        .eq('startup_id', startup.id);
      if (error) throw error;
      invalidate();
      toast({
        title: 'Removed from profile',
        description: `${startup.name} has been removed from your profile.`,
      });
    } catch (err: any) {
      toast({ title: 'Failed to remove', description: err.message, variant: 'destructive' });
    } finally {
      setPending(null);
    }
  };

  return { profileStartupIds, addToProfile, removeFromProfile, pending };
}

/* ─── Stage meta ─────────────────────────────────────────────── */
const stageMeta: Record<string, { color: string; glow: string }> = {
  idea:       { color: '#8b5cf6', glow: 'rgba(139,92,246,0.18)' },
  validation: { color: '#f59e0b', glow: 'rgba(245,158,11,0.18)' },
  mvp:        { color: '#0ea5e9', glow: 'rgba(14,165,233,0.18)'  },
  growth:     { color: '#10b981', glow: 'rgba(16,185,129,0.18)' },
};

/* ─── Shared styles injected once ───────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .ms-tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 18px;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    color: rgba(255,255,255,0.4);
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .ms-tab:hover { color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.05); }
  .ms-tab.active {
    color: #fff;
    font-weight: 600;
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.1);
  }
  .ms-tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 50%;
    transform: translateX(-50%);
    width: 60%; height: 2px;
    border-radius: 2px 2px 0 0;
    background: #6366f1;
    box-shadow: 0 0 8px rgba(99,102,241,0.7);
  }
  .ms-tab-collab.active::after { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.7); }

  .ms-avatar {
    display: inline-flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border-radius: 50%;
    font-family: 'DM Sans', sans-serif;
    font-size: 10px; font-weight: 700; color: #fff;
    border: 2px solid rgba(8,12,20,0.9);
    flex-shrink: 0;
  }
  .ms-avatar-stack { display: flex; }
  .ms-avatar-stack .ms-avatar { margin-left: -8px; }
  .ms-avatar-stack .ms-avatar:first-child { margin-left: 0; }

  @keyframes ms-slide-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ms-animate { animation: ms-slide-up 0.4s ease both; }
  .ms-animate-d1 { animation-delay: 0.05s; }
  .ms-animate-d2 { animation-delay: 0.1s; }
  .ms-animate-d3 { animation-delay: 0.15s; }
  .ms-animate-d4 { animation-delay: 0.2s; }
`;

/* ─── Stat Pill ─────────────────────────────────────────────── */
function StatPill({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number | string; color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}22` }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-medium text-white/40 leading-none">{label}</p>
        <p className="text-sm font-bold text-white leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────── */
function EmptyState({ type, onNew }: { type: 'solo' | 'collab'; onNew: () => void }) {
  const isSolo = type === 'solo';
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/6 bg-white/[0.02] p-12 text-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className={`h-64 w-64 rounded-full blur-3xl ${isSolo ? 'bg-indigo-600/10' : 'bg-emerald-600/10'}`} />
      </div>
      <div className="relative">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04]">
          {isSolo ? <Rocket className="h-9 w-9 text-white/20" /> : <Users className="h-9 w-9 text-white/20" />}
        </div>
        <h3 className="text-lg font-bold text-white/80">
          {isSolo ? 'No startups yet' : 'No team startups yet'}
        </h3>
        <p className="mt-1.5 text-sm text-white/35 max-w-xs mx-auto">
          {isSolo
            ? 'Launch your first solo venture and start tracking milestones and growth.'
            : 'Create a startup with co-founders to collaborate, share milestones and build together.'}
        </p>
        <Button
          onClick={onNew}
          className={`mt-6 gap-2 rounded-xl border-0 shadow-lg px-6 ${
            isSolo
              ? 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-indigo-500/20'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20'
          }`}
        >
          <Plus className="h-4 w-4" />
          {isSolo ? 'Create First Startup' : 'Start a Team Startup'}
        </Button>
      </div>
    </div>
  );
}

/* ─── Startup Card ───────────────────────────────────────────── */
function StartupCard({
  startup, milestones, onDelete, isCollab = false,
  onAddToProfile, onRemoveFromProfile, isPending, isOnProfile,
}: {
  startup: any; milestones: any[]; onDelete: () => void; isCollab?: boolean;
  onAddToProfile: () => void; onRemoveFromProfile: () => void;
  isPending: boolean; isOnProfile: boolean;
}) {
  const completedCount  = milestones.filter(m => m.status === 'completed').length;
  const inProgressCount = milestones.filter(m => m.status === 'in-progress').length;
  const pendingCount    = milestones.filter(m => m.status === 'pending').length;
  const progress = milestones.length ? Math.round((completedCount / milestones.length) * 100) : 0;
  const meta = stageMeta[startup.stage] ?? stageMeta.idea;
  const { user } = useAuth();

  // Collab members — in real app this comes from startup.members
  const members: { initials: string; color: string }[] = startup.members ?? [];

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/6 bg-white/[0.025] transition-all duration-300 hover:border-white/12 hover:bg-white/[0.04]"
      onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 8px 32px -8px ${meta.glow}`)}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Top accent stripe */}
      <div className="absolute left-0 top-0 h-0.5 w-full opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }} />

      {/* Collab indicator stripe on left edge */}
      {isCollab && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 opacity-70"
          style={{ background: 'linear-gradient(180deg, transparent, #10b981, transparent)' }} />
      )}

      {/* Stage glow blob */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: meta.glow }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/8 transition-transform duration-300 group-hover:scale-105"
              style={{ background: `${meta.color}18` }}>
              {isCollab ? <Users className="h-5 w-5" style={{ color: meta.color }} /> : <Rocket className="h-5 w-5" style={{ color: meta.color }} />}
              {progress === 100 && (
                <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                  <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="truncate text-base font-bold text-white leading-tight">{startup.name}</h3>
                {isCollab && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border"
                    style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)', color: '#10b981' }}>
                    <GitMerge className="h-2.5 w-2.5" /> Team
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <StageBadge stage={startup.stage as any} />
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ borderColor: `${meta.color}30`, background: `${meta.color}12`, color: meta.color }}>
                  <Zap className="h-2.5 w-2.5" /> {milestones.length} tasks
                </span>
              </div>
            </div>
          </div>

          <Button variant="ghost" size="icon"
            className="h-8 w-8 shrink-0 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Description */}
        <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-4">
          {startup.description || 'No description provided.'}
        </p>

        {/* Progress */}
        {milestones.length > 0 && (
          <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Progress</span>
              <span className="text-sm font-black tabular-nums" style={{ color: meta.color }}>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/6">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}99)`, boxShadow: `0 0 8px ${meta.color}66` }} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] text-white/40"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{completedCount} done</span>
              <span className="flex items-center gap-1 text-[10px] text-white/40"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{inProgressCount} active</span>
              <span className="flex items-center gap-1 text-[10px] text-white/40"><span className="h-1.5 w-1.5 rounded-full bg-white/20" />{pendingCount} pending</span>
            </div>
          </div>
        )}

        {/* Co-founders row — only for collab */}
        {isCollab && members.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Co-founders</span>
            <div className="ms-avatar-stack">
              {members.map((m, i) => (
                <div key={i} className="ms-avatar" style={{ background: m.color }} title={m.initials}>
                  {m.initials}
                </div>
              ))}
              <button className="ms-avatar" style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px dashed rgba(255,255,255,0.2)' }}
                title="Invite co-founder">
                <UserPlus style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.4)' }} />
              </button>
            </div>
          </div>
        )}

        {/* Meta row */}
        <div className="mb-4 flex flex-wrap gap-2 text-[11px] text-white/30">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {isCollab ? `${members.length + 1} founders` : (user?.full_name || 'You')}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(startup.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button asChild size="sm"
            className="flex-1 h-8 rounded-xl text-xs font-semibold gap-1.5 border-0"
            style={{ background: `${meta.color}20`, color: meta.color }}>
            <Link to={`/startup/${startup.id}`}>
              <BarChart3 className="h-3.5 w-3.5" /> View Details
              <ArrowUpRight className="h-3 w-3 ml-auto opacity-60" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm"
            className="h-8 w-8 p-0 rounded-xl border border-white/6 hover:border-white/12 hover:bg-white/5">
            <Link to="/milestones" title="Milestones">
              <Target className="h-3.5 w-3.5 text-white/40" />
            </Link>
          </Button>
          {/* ── Profile toggle ── */}
          <Button
            size="sm"
            title={isOnProfile ? 'Remove from profile' : 'Add to profile'}
            disabled={isPending}
            onClick={isOnProfile ? onRemoveFromProfile : onAddToProfile}
            className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5 border-0 shrink-0 transition-all"
            style={
              isPending
                ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }
                : isOnProfile
                ? { background: 'rgba(16,185,129,0.15)', color: '#10b981' }
                : { background: 'rgba(99,102,241,0.15)', color: '#818cf8' }
            }
          >
            {isPending
              ? <><Clock className="h-3.5 w-3.5 animate-spin" /> Saving…</>
              : isOnProfile
              ? <><UserCheck className="h-3.5 w-3.5" /> On Profile</>
              : <><BookmarkPlus className="h-3.5 w-3.5" /> Add to Profile</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Create Dialog ──────────────────────────────────────────── */
function CreateDialog({
  open, onOpenChange, isCollab = false,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; isCollab?: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState('idea');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invites, setInvites] = useState<string[]>([]);
  const createStartup = useCreateStartup();

  const addInvite = () => {
    if (inviteEmail.trim() && !invites.includes(inviteEmail.trim())) {
      setInvites(prev => [...prev, inviteEmail.trim()]);
      setInviteEmail('');
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createStartup.mutateAsync({
      name: name.trim(),
      description: description.trim(),
      stage,
      is_collab: isCollab,
      invite_emails: isCollab ? invites : [],
    });
    setName(''); setDescription(''); setStage('idea'); setInvites([]); onOpenChange(false);
  };

  const accent = isCollab ? '#10b981' : '#6366f1';
  const accentTo = isCollab ? '#14b8a6' : '#8b5cf6';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/8 bg-[#0d1117] max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: `${accent}20` }}>
              {isCollab ? <Users className="h-4 w-4" style={{ color: accent }} /> : <Rocket className="h-4 w-4" style={{ color: accent }} />}
            </div>
            <DialogTitle className="text-white text-base font-bold">
              {isCollab ? 'Start a Team Startup' : 'Create a Startup'}
            </DialogTitle>
          </div>
          {isCollab && (
            <p className="text-xs text-white/35 leading-relaxed mt-1">
              Build with co-founders. Everyone gets full access to milestones, docs, and messages.
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Name</label>
            <Input value={name} onChange={e => setName(e.target.value)}
              placeholder={isCollab ? 'Team Startup Name' : 'My Awesome Startup'}
              className="bg-white/[0.04] border-white/8 text-white placeholder:text-white/20"
              style={{ '--tw-ring-color': accent } as any} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="What problem does this startup solve?"
              className="bg-white/[0.04] border-white/8 text-white placeholder:text-white/20 resize-none" rows={3} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Stage</label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="bg-white/[0.04] border-white/8 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1117] border-white/8">
                <SelectItem value="idea">💡 Idea</SelectItem>
                <SelectItem value="validation">🔍 Validation</SelectItem>
                <SelectItem value="mvp">🚀 MVP</SelectItem>
                <SelectItem value="growth">📈 Growth</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Co-founder invite — collab only */}
          {isCollab && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Invite Co-founders</label>
              <div className="flex gap-2">
                <Input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addInvite()}
                  placeholder="co-founder@email.com"
                  className="bg-white/[0.04] border-white/8 text-white placeholder:text-white/20 flex-1"
                />
                <Button type="button" onClick={addInvite} size="sm"
                  className="rounded-lg border-0 px-3 shrink-0"
                  style={{ background: `${accent}20`, color: accent }}>
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {invites.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {invites.map(email => (
                    <span key={email}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border cursor-pointer hover:line-through hover:opacity-50 transition-all"
                      style={{ background: `${accent}10`, borderColor: `${accent}25`, color: accent }}
                      onClick={() => setInvites(prev => prev.filter(e => e !== email))}>
                      {email} ×
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-white/25">Press Enter or click + to add. Click a tag to remove.</p>
            </div>
          )}

          <Button onClick={handleCreate} disabled={createStartup.isPending || !name.trim()}
            className="w-full h-10 rounded-xl border-0 font-semibold text-sm"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accentTo})` }}>
            {createStartup.isPending ? 'Creating…' : isCollab ? 'Launch Team Startup' : 'Launch Startup'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function MyStartup() {
  const { user } = useAuth();
  const { data: startups = [], isLoading } = useMyStartups();
  const startupIds = startups.map(s => s.id);
  const { data: milestones = [] } = useMilestonesByStartups(startupIds);
  const deleteStartup = useDeleteStartup();
  const { profileStartupIds, addToProfile, removeFromProfile, pending } = useProfileStartups();

  const [tab, setTab] = useState<'solo' | 'collab'>('solo');
  const [soloOpen, setSoloOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);

  // Split startups by type
  const soloStartups  = startups.filter(s => !s.is_collab);
  const collabStartups = startups.filter(s => s.is_collab);

  const activeList = tab === 'solo' ? soloStartups : collabStartups;
  const totalMilestones = milestones.length;
  const totalCompleted  = milestones.filter(m => m.status === 'completed').length;
  const totalInProgress = milestones.filter(m => m.status === 'in-progress').length;
  const overallPct      = totalMilestones ? Math.round((totalCompleted / totalMilestones) * 100) : 0;

  if (isLoading) return (
    <div className="space-y-6 p-1">
      <Skeleton className="h-9 w-52 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        {[1,2].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-7 px-1 pb-10">
      <style>{STYLES}</style>

      {/* ── PAGE HEADER ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5">
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-16 h-24 w-24 rounded-full bg-violet-600/10 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-indigo-300">
              <Sparkles className="h-3 w-3" /> Venture Hub
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight">My Startups</h1>
            <p className="mt-1 text-sm text-white/40">Your solo ventures and team collaborations, all in one place.</p>
          </div>

          {/* Create buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={() => setSoloOpen(true)}
              className="gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0 shadow-lg shadow-indigo-500/20 text-sm">
              <Plus className="h-4 w-4" /> New Startup
            </Button>
            <Button onClick={() => setCollabOpen(true)}
              className="gap-2 rounded-xl border-0 shadow-lg shadow-emerald-500/15 text-sm"
              style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}>
              <Users className="h-4 w-4" /> Team Startup
            </Button>
          </div>
        </div>
      </div>

      {/* ── STATS ────────────────────────────────────────────── */}
      {startups.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 ms-animate">
          <StatPill icon={Rocket}       label="Solo"        value={soloStartups.length}   color="#6366f1" />
          <StatPill icon={Users}        label="Team"        value={collabStartups.length} color="#10b981" />
          <StatPill icon={CheckCircle2} label="Completed"   value={totalCompleted}        color="#10b981" />
          <StatPill icon={TrendingUp}   label="Overall"     value={`${overallPct}%`}      color="#8b5cf6" />
        </div>
      )}

      {/* ── TABS ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-xl border border-white/6 bg-white/[0.02] p-1 w-fit">
        <button
          className={`ms-tab ${tab === 'solo' ? 'active' : ''}`}
          onClick={() => setTab('solo')}
        >
          <Rocket className="h-3.5 w-3.5" />
          Solo
          {soloStartups.length > 0 && (
            <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={{ background: tab === 'solo' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)', color: tab === 'solo' ? '#818cf8' : 'rgba(255,255,255,0.3)' }}>
              {soloStartups.length}
            </span>
          )}
        </button>
        <button
          className={`ms-tab ms-tab-collab ${tab === 'collab' ? 'active' : ''}`}
          onClick={() => setTab('collab')}
        >
          <GitMerge className="h-3.5 w-3.5" />
          Team
          {collabStartups.length > 0 && (
            <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={{ background: tab === 'collab' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)', color: tab === 'collab' ? '#34d399' : 'rgba(255,255,255,0.3)' }}>
              {collabStartups.length}
            </span>
          )}
        </button>
      </div>

      {/* ── COLLAB EXPLAINER (only when on collab tab with no startups) ── */}
      {tab === 'collab' && collabStartups.length === 0 && (
        <div className="ms-animate rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-5 py-4 flex gap-4 items-start">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <GitMerge className="h-4.5 w-4.5 text-emerald-400" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">Build with co-founders</p>
            <p className="mt-0.5 text-xs text-white/40 leading-relaxed max-w-lg">
              Team startups work just like solo ones — milestones, docs, messages — but everyone on the team has full access. Invite co-founders by email when you create one.
            </p>
          </div>
        </div>
      )}

      {/* ── EMPTY STATE ──────────────────────────────────────── */}
      {activeList.length === 0 && (
        <EmptyState type={tab} onNew={() => tab === 'solo' ? setSoloOpen(true) : setCollabOpen(true)} />
      )}

      {/* ── STARTUP GRID ─────────────────────────────────────── */}
      {activeList.length > 0 && (
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
          {activeList.map((startup, i) => (
            <div key={startup.id} className={`ms-animate ms-animate-d${Math.min(i + 1, 4)}`}>
              <StartupCard
                startup={startup}
                milestones={milestones.filter(m => m.startup_id === startup.id)}
                onDelete={() => deleteStartup.mutate(startup.id)}
                isCollab={tab === 'collab'}
                onAddToProfile={() => addToProfile(startup)}
                onRemoveFromProfile={() => removeFromProfile(startup)}
                isPending={pending === startup.id}
                isOnProfile={profileStartupIds.has(startup.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE DIALOGS ────────────────────────────────────── */}
      <CreateDialog open={soloOpen}   onOpenChange={setSoloOpen}   isCollab={false} />
      <CreateDialog open={collabOpen} onOpenChange={setCollabOpen} isCollab={true}  />
    </div>
  );
}