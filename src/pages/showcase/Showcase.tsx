import { useState, useMemo } from 'react';
import {
  Rocket, Users, Target, Search, Heart, TrendingUp, Clock, Flame,
  Sparkles, X, Filter, ArrowUpRight, CheckCircle2,
  Circle, Loader2, LayoutGrid, List, Star, DollarSign,
  Calendar, ExternalLink, BadgeCheck, Globe,
  MessageSquare, Bookmark, Share2, Image as ImageIcon, Send,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StageBadge } from '@/components/shared/Stagebadge';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAllStartups, StartupRow } from '@/hooks/use-startups';
import { useShowcaseData } from '@/hooks/use-showcase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { StartupSocialBar } from '@/components/showcase/StartupSocialBar';
import {
  useShowcasePosts,
  useCreatePost,
  useStartupLikes,
  useToggleStartupLike,
  useTogglePostLike,
  usePostLikes,
  useSocialRealtime,
} from '@/hooks/use-social-feed';
import { format } from 'date-fns';

/* ── Stage config ────────────────────────────────────────────── */
const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  idea:        { label: 'Idea',        color: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  mvp:         { label: 'MVP',         color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  growth:      { label: 'Growth',      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  scaling:     { label: 'Scaling',     color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  established: { label: 'Established', color: 'bg-primary/10 text-primary border-primary/20' },
};
const ALL_STAGES = ['All', ...Object.keys(STAGE_CONFIG)];
type SortKey = 'newest' | 'trending' | 'progress';
type GrantStageFilter = 'All' | 'idea' | 'mvp' | 'growth' | 'scaling' | 'established';

const SORT_OPTIONS: { value: SortKey; label: string; icon: React.ElementType }[] = [
  { value: 'newest',   label: 'Newest',   icon: Clock },
  { value: 'trending', label: 'Trending', icon: Flame },
  { value: 'progress', label: 'Progress', icon: TrendingUp },
];
const CARD_GRADIENTS = [
  'from-violet-500/20 via-primary/10 to-transparent',
  'from-emerald-500/20 via-teal-500/10 to-transparent',
  'from-amber-500/20 via-orange-500/10 to-transparent',
  'from-blue-500/20 via-cyan-500/10 to-transparent',
  'from-pink-500/20 via-rose-500/10 to-transparent',
  'from-indigo-500/20 via-purple-500/10 to-transparent',
];
function getGradient(id: string) {
  const idx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % CARD_GRADIENTS.length;
  return CARD_GRADIENTS[idx];
}

/** Derive initials from a display name */
function toInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

/** Resolve display name robustly from a Supabase user object */
function resolveUserName(user: any): string {
  return (
    user?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Unknown'
  );
}

/* ── Grants data ─────────────────────────────────────────────── */
const GRANTS = [
  {
    id: 'g1',
    name: 'Tony Elumelu Foundation Grant',
    org: 'Tony Elumelu Foundation',
    orgLogo: 'TEF',
    orgColor: '#f59e0b',
    amount: '$5,000',
    deadline: '2026-06-30',
    stage: ['idea', 'mvp'],
    region: 'Africa',
    description: 'Seed capital, mentorship and training for 1,000 African entrepreneurs annually. No repayment required.',
    tags: ['Non-repayable', 'Pan-African', 'Mentorship included'],
    url: 'https://www.tonyelumelufoundation.org',
    verified: true,
    applicants: 12400,
  },
  {
    id: 'g2',
    name: 'Google for Startups Black Founders Fund',
    org: 'Google',
    orgLogo: 'G',
    orgColor: '#4285f4',
    amount: 'Up to $100K',
    deadline: '2026-07-15',
    stage: ['mvp', 'growth'],
    region: 'Global',
    description: 'Cash awards plus Google Cloud credits for Black-led startups building tech-driven solutions.',
    tags: ['Equity-free', 'Cloud credits', 'Tech focus'],
    url: 'https://startup.google.com',
    verified: true,
    applicants: 3200,
  },
  {
    id: 'g3',
    name: 'Seedstars Africa Ventures',
    org: 'Seedstars',
    orgLogo: 'SS',
    orgColor: '#10b981',
    amount: '$500K–$2M',
    deadline: '2026-08-01',
    stage: ['growth', 'scaling'],
    region: 'Sub-Saharan Africa',
    description: 'Early-stage venture investment targeting scalable tech startups solving local challenges across Africa.',
    tags: ['Equity investment', 'VC-backed', 'Tech-enabled'],
    url: 'https://seedstars.com',
    verified: true,
    applicants: 890,
  },
  {
    id: 'g4',
    name: 'MEST Africa Fellowship',
    org: 'MEST Africa',
    orgLogo: 'MA',
    orgColor: '#8b5cf6',
    amount: '$50K–$250K',
    deadline: '2026-09-15',
    stage: ['idea', 'mvp'],
    region: 'West Africa',
    description: "Training, seed funding and mentorship for software entrepreneurs across Ghana, Nigeria, Kenya and Côte d'Ivoire.",
    tags: ['Fellowship', 'Seed funding', 'Software focus'],
    url: 'https://meltwater.org',
    verified: true,
    applicants: 1500,
  },
  {
    id: 'g5',
    name: 'African Development Bank Funding',
    org: 'AfDB',
    orgLogo: 'ADB',
    orgColor: '#0ea5e9',
    amount: 'Varies',
    deadline: '2026-10-01',
    stage: ['growth', 'scaling', 'established'],
    region: 'Africa',
    description: 'Financing for SMEs and startups driving economic development across African markets.',
    tags: ['Development finance', 'SME focused', 'Impact driven'],
    url: 'https://www.afdb.org',
    verified: true,
    applicants: 4200,
  },
  {
    id: 'g6',
    name: 'YC Africa Startup School',
    org: 'Y Combinator',
    orgLogo: 'YC',
    orgColor: '#f97316',
    amount: 'Free + $500K option',
    deadline: '2026-07-30',
    stage: ['idea', 'mvp'],
    region: 'Global',
    description: 'Online program teaching how to start a startup, with potential path to YC application and $500K standard deal.',
    tags: ['Equity-free', 'YC access', 'Education'],
    url: 'https://startupschool.org',
    verified: true,
    applicants: 28000,
  },
];

/* ── Global styles (CSS variables — light + dark safe) ───────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .sc-feed-composer {
    border: 1px solid hsl(var(--border));
    border-radius: 16px;
    background: hsl(var(--muted) / 0.4);
    padding: 16px;
    transition: border-color 0.2s;
  }
  .sc-feed-composer:focus-within {
    border-color: hsl(var(--primary) / 0.35);
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.08);
  }

  .sc-feed-post {
    border: 1px solid hsl(var(--border));
    border-radius: 16px;
    background: hsl(var(--card));
    padding: 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .sc-feed-post:hover {
    border-color: hsl(var(--primary) / 0.2);
    box-shadow: 0 4px 24px -8px hsl(var(--foreground) / 0.08);
  }

  .sc-feed-action {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 8px;
    font-size: 12px; font-weight: 600;
    color: hsl(var(--muted-foreground));
    background: transparent; border: none; cursor: pointer;
    transition: background 0.15s, color 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .sc-feed-action:hover:not(:disabled) { background: hsl(var(--muted)); color: hsl(var(--foreground)); }
  .sc-feed-action:disabled { opacity: 0.4; cursor: default; }
  .sc-feed-action.liked { color: hsl(var(--destructive)); }
  .sc-feed-action.liked:hover:not(:disabled) { background: hsl(var(--destructive) / 0.08); }

  .sc-grant-card {
    position: relative;
    border: 1px solid hsl(var(--border));
    border-radius: 16px;
    background: hsl(var(--card));
    padding: 20px;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    cursor: default;
    overflow: hidden;
  }
  .sc-grant-card:hover {
    border-color: hsl(var(--primary) / 0.2);
    box-shadow: 0 8px 32px -8px hsl(var(--foreground) / 0.1);
    transform: translateY(-2px);
  }

  @keyframes sc-slide-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sc-animate { animation: sc-slide-up 0.35s ease both; }
  .sc-d1 { animation-delay: 0.04s; }
  .sc-d2 { animation-delay: 0.08s; }
  .sc-d3 { animation-delay: 0.12s; }
  .sc-d4 { animation-delay: 0.16s; }
  .sc-d5 { animation-delay: 0.20s; }
  .sc-d6 { animation-delay: 0.24s; }

  @keyframes sc-spin { to { transform: rotate(360deg); } }
  .sc-spin { animation: sc-spin 1s linear infinite; display: inline-block; }
`;

/* ── Grant Card ──────────────────────────────────────────────── */
function GrantCard({ grant, index }: { grant: typeof GRANTS[0]; index: number }) {
  const [saved, setSaved] = useState(false);

  const daysLeft  = Math.ceil((new Date(grant.deadline).getTime() - Date.now()) / 86400000);
  const isExpired = daysLeft < 0;
  const isUrgent  = !isExpired && daysLeft <= 30;

  const deadlineLabel = isExpired
    ? 'Closed'
    : isUrgent
    ? `${daysLeft}d left`
    : format(new Date(grant.deadline), 'MMM d, yyyy');

  return (
    <div className={`sc-grant-card sc-animate sc-d${Math.min(index + 1, 6)}`}>
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${grant.orgColor}, transparent)`,
        opacity: 0.7,
      }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: `${grant.orgColor}20`,
            border: `1px solid ${grant.orgColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: grant.orgColor,
            fontFamily: 'Syne, sans-serif',
          }}>
            {grant.orgLogo}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {grant.org}
              </p>
              {grant.verified && <BadgeCheck className="h-3 w-3 text-primary shrink-0" />}
            </div>
            <h3 className="text-sm font-bold text-foreground leading-snug">{grant.name}</h3>
          </div>
        </div>
        <button
          onClick={() => setSaved(s => !s)}
          className={cn(
            'shrink-0 p-1.5 rounded-lg border transition-all',
            saved
              ? 'bg-primary/10 border-primary/20 text-primary'
              : 'bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground',
          )}
        >
          <Bookmark className="h-3.5 w-3.5" style={{ fill: saved ? 'currentColor' : 'none' }} />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{grant.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {grant.tags.map(tag => (
          <span key={tag} className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted border border-border/60 text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-3 items-center mb-3">
        <span className="flex items-center gap-1">
          <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-sm font-bold text-emerald-500">{grant.amount}</span>
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" /> {grant.region}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" /> {grant.applicants.toLocaleString()} applicants
        </span>
        <span
          className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border"
          style={{
            color: isExpired ? 'hsl(var(--muted-foreground))' : isUrgent ? '#f87171' : 'hsl(var(--muted-foreground))',
            background: isUrgent ? 'rgba(239,68,68,0.08)' : 'hsl(var(--muted) / 0.4)',
            borderColor: isUrgent ? 'rgba(239,68,68,0.2)' : 'hsl(var(--border))',
            opacity: isExpired ? 0.5 : 1,
          }}
        >
          <Calendar className="h-3 w-3" /> {deadlineLabel}
        </span>
      </div>

      {/* Stage eligibility */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Eligible:</span>
        {grant.stage.map(s => (
          <span key={s} className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
            {s}
          </span>
        ))}
      </div>

      {/* CTA */}
      <a
        href={grant.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border transition-colors no-underline"
        style={{
          background: `${grant.orgColor}18`,
          borderColor: `${grant.orgColor}30`,
          color: grant.orgColor,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = `${grant.orgColor}28`)}
        onMouseLeave={e => (e.currentTarget.style.background = `${grant.orgColor}18`)}
      >
        Apply Now <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

/* ── Feed Post Card ──────────────────────────────────────────── */
function FeedPost({ post, currentUserId }: { post: any; currentUserId?: string }) {
  const { data: allPostLikes = [] } = usePostLikes();
  const postLikes = allPostLikes.filter((l: any) => l.post_id === post.id);
  const togglePostLike = useTogglePostLike();
  const [showComments, setShowComments] = useState(false);

  const liked = postLikes.some((l: any) => l.user_id === currentUserId);

  const handleLike = () => {
    if (!currentUserId || togglePostLike.isPending) return;
    togglePostLike.mutate(post.id);
  };

  // author_name is populated from the profiles join in useShowcasePosts
  const authorName = post.author_name?.trim() || post.user_id?.slice(0, 8) || 'Anonymous';
  const initials   = toInitials(authorName);

  return (
    <div className="sc-feed-post">
      {/* Author row */}
      <div className="flex items-center gap-2.5 mb-3">
        <Avatar className="h-9 w-9 shrink-0">
          {post.author_avatar && <AvatarImage src={post.author_avatar} />}
          <AvatarFallback
            className="text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">{authorName}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {post.startup_name && (
              <span className="text-primary font-semibold">{post.startup_name} · </span>
            )}
            {post.created_at ? format(new Date(post.created_at), 'MMM d') : 'recently'}
          </p>
        </div>
        {post.startup_stage && <StageBadge stage={post.startup_stage} />}
      </div>

      {/* Content */}
      <p className="text-sm text-foreground/80 leading-relaxed mb-3">{post.content}</p>

      {/* Milestone callout */}
      {post.milestone_title && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <p className="text-xs font-semibold text-emerald-600">
            Milestone reached: {post.milestone_title}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-border/50 my-2.5" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          className={`sc-feed-action ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={!currentUserId || togglePostLike.isPending}
        >
          <Heart className="h-3.5 w-3.5" style={{ fill: liked ? 'currentColor' : 'none' }} />
          {postLikes.length > 0 && <span>{postLikes.length}</span>} Like
        </button>
        <button className="sc-feed-action" onClick={() => setShowComments(s => !s)}>
          <MessageSquare className="h-3.5 w-3.5" />
          {post.comments_count > 0 && <span>{post.comments_count}</span>} Comment
        </button>
        <button className="sc-feed-action">
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
      </div>
    </div>
  );
}

/* ── Feed Composer ───────────────────────────────────────────── */
function FeedComposer({ user }: { user: any }) {
  const [text, setText] = useState('');
  const createPost = useCreatePost();

  const authorName = resolveUserName(user);
  const initials   = toInitials(authorName);
  const avatarUrl  = user?.avatar_url || user?.user_metadata?.avatar_url;
  const canPost    = text.trim().length > 0 && !createPost.isPending;

  const handlePost = () => {
    if (!canPost) return;
    createPost.mutate(
      { content: text.trim() },
      { onSuccess: () => setText('') },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost();
  };

  return (
    <div className="sc-feed-composer">
      <div className="flex gap-2.5">
        <Avatar className="h-9 w-9 shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} />}
          <AvatarFallback
            className="text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share a milestone, update or insight… (⌘↵ to post)"
            className="w-full resize-none bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground leading-relaxed"
            style={{ minHeight: 72, fontFamily: 'DM Sans, sans-serif' }}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
            <div className="flex gap-1">
              <button className="sc-feed-action" style={{ padding: '4px 8px' }}>
                <ImageIcon className="h-3.5 w-3.5" /> Photo
              </button>
              <button className="sc-feed-action" style={{ padding: '4px 8px' }}>
                <Target className="h-3.5 w-3.5" /> Milestone
              </button>
            </div>
            <button
              onClick={handlePost}
              disabled={!canPost}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg transition-all"
              style={{
                background: canPost ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'hsl(var(--muted))',
                color: canPost ? '#fff' : 'hsl(var(--muted-foreground))',
                boxShadow: canPost ? '0 4px 16px -4px rgba(99,102,241,0.45)' : 'none',
                cursor: canPost ? 'pointer' : 'default',
              }}
            >
              {createPost.isPending
                ? <><Loader2 className="h-3.5 w-3.5 sc-spin" /> Posting…</>
                : <><Send className="h-3.5 w-3.5" /> Post</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Startup Detail Dialog ───────────────────────────────────── */
interface StartupDetailDialogProps {
  selected: StartupRow;
  founders: Record<string, string>;
  milestones: any[];
  startupLikes: any[];
  user: any;
  toggleStartupLike: { mutate: (id: string) => void; isPending: boolean };
}

function StartupDetailDialog({
  selected, founders, milestones, startupLikes, user, toggleStartupLike,
}: StartupDetailDialogProps) {
  const ms      = milestones.filter(m => m.startup_id === selected.id);
  const done    = ms.filter(m => m.status === 'completed').length;
  const inProg  = ms.filter(m => m.status === 'in-progress').length;
  const pending = ms.filter(m => m.status === 'pending').length;
  const pct     = ms.length ? Math.round((done / ms.length) * 100) : 0;
  const sLikes  = startupLikes.filter(l => l.startup_id === selected.id);
  const liked   = sLikes.some(l => l.user_id === user?.id);
  const gradient = getGradient(selected.id);

  return (
    <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto p-0 gap-0 rounded-2xl">
      {/* Hero banner */}
      <div className={`h-32 bg-gradient-to-br ${gradient} border-b border-border/40 flex items-end p-5`}>
        <div className="h-14 w-14 rounded-2xl bg-background/80 backdrop-blur-sm border border-border/40 flex items-center justify-center shadow-sm">
          <Rocket className="h-7 w-7 text-primary" />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Title + like */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold leading-tight">{selected.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              By {founders[selected.student_id || ''] || 'Unknown'}
            </p>
          </div>
          <button
            onClick={() => user && toggleStartupLike.mutate(selected.id)}
            disabled={!user || toggleStartupLike.isPending}
            className={cn(
              'flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border transition-all',
              liked
                ? 'text-destructive bg-destructive/10 border-destructive/20'
                : 'text-muted-foreground border-border/60 hover:bg-muted',
            )}
          >
            <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            {sLikes.length}
          </button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <StageBadge stage={selected.stage as any} />
          {selected.status && (
            <Badge variant="outline" className="rounded-full text-xs">{selected.status}</Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            Founded {format(new Date(selected.created_at), 'MMM d, yyyy')}
          </span>
        </div>

        {/* Description */}
        {selected.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
        )}

        {/* Milestones */}
        {ms.length > 0 ? (
          <div className="bg-muted/40 border border-border/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Milestone Progress</p>
              <span className="text-sm font-bold text-primary">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2 rounded-full" />
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Done',    value: done,    color: 'text-emerald-600 bg-emerald-500/10', icon: CheckCircle2 },
                { label: 'Active',  value: inProg,  color: 'text-amber-600 bg-amber-500/10',     icon: Loader2 },
                { label: 'Pending', value: pending, color: 'text-muted-foreground bg-muted',     icon: Circle },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className={`flex flex-col items-center py-2.5 rounded-xl ${color}`}>
                  <Icon className="h-4 w-4 mb-1" />
                  <span className="text-base font-bold leading-none">{value}</span>
                  <span className="text-[11px] mt-0.5 opacity-80">{label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Milestones</p>
              {ms.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center gap-2.5 text-sm">
                  {m.status === 'completed'
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    : m.status === 'in-progress'
                    ? <Loader2 className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-spin" />
                    : <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  <span className={cn('truncate', m.status === 'completed' && 'line-through text-muted-foreground')}>
                    {m.title}
                  </span>
                  {m.due_date && (
                    <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
                      {format(new Date(m.due_date), 'MMM d')}
                    </span>
                  )}
                </div>
              ))}
              {ms.length > 5 && (
                <p className="text-xs text-muted-foreground pt-1">+{ms.length - 5} more milestones</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No milestones tracked yet.</p>
        )}

        <StartupSocialBar startupId={selected.id} />
      </div>
    </DialogContent>
  );
}

/* ── Shared card props ───────────────────────────────────────── */
interface CardProps {
  startup: StartupRow;
  founderName: string;
  pct: number;
  ms: any[];
  sLikes: any[];
  liked: boolean;
  gradient: string;
  user: any;
  onOpen: () => void;
  onLike: () => void;
  isPending: boolean;
}

function StartupGridCard({ startup, founderName, pct, ms, sLikes, liked, gradient, user, onOpen, onLike, isPending }: CardProps) {
  return (
    <Card
      className="group overflow-hidden rounded-2xl border-border/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 cursor-pointer"
      onClick={onOpen}
    >
      <div className={`h-24 bg-gradient-to-br ${gradient} border-b border-border/40 relative`}>
        {ms.length > 0 && (
          <div className="absolute top-3 right-3">
            <CircularProgress value={pct} size={40} strokeWidth={3.5} showPercentage={false} />
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 -mt-8 ring-2 ring-background shadow-sm">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-bold text-sm leading-tight truncate">{startup.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <StageBadge stage={startup.stage as any} />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {startup.description || 'No description provided.'}
        </p>
        {ms.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{ms.filter(m => m.status === 'completed').length}/{ms.length} milestones</span>
              <span className="font-semibold text-foreground">{pct}%</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <span className="text-[11px] text-muted-foreground truncate max-w-[60%]">By {founderName}</span>
          <button
            onClick={e => { e.stopPropagation(); onLike(); }}
            disabled={!user || isPending}
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all',
              liked ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <Heart className={cn('h-3.5 w-3.5', liked && 'fill-current')} /> {sLikes.length}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function StartupListRow({ startup, founderName, pct, ms, sLikes, liked, gradient, user, onOpen, onLike, isPending }: CardProps) {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group"
      onClick={onOpen}
    >
      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} border border-border/30 flex items-center justify-center shrink-0`}>
        <Rocket className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm">{startup.name}</h3>
          <StageBadge stage={startup.stage as any} />
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {startup.description || 'No description.'}
        </p>
        {ms.length > 0 && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden max-w-[100px]">
              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] text-muted-foreground">{pct}%</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-muted-foreground hidden sm:block">{founderName}</span>
        <button
          onClick={e => { e.stopPropagation(); onLike(); }}
          disabled={!user || isPending}
          className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all',
            liked ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          <Heart className={cn('h-3.5 w-3.5', liked && 'fill-current')} /> {sLikes.length}
        </button>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle, action }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border/60">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground/50">
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">{subtitle}</p>
      {action}
    </div>
  );
}

/* ── Main Showcase page ──────────────────────────────────────── */
export default function Showcase() {
  useSocialRealtime();
  const { user } = useAuth();

  const { data: startups = [],  isLoading: startupsLoading } = useAllStartups();
  const { founders, milestones, isLoading: extraLoading }    = useShowcaseData(startups);
  const { data: posts = [],     isLoading: postsLoading }    = useShowcasePosts();
  const { data: startupLikes = [] }                          = useStartupLikes();
  const toggleStartupLike = useToggleStartupLike();

  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState<StartupRow | null>(null);
  const [stageFilter, setStageFilter] = useState('All');
  const [sortKey,     setSortKey]     = useState<SortKey>('newest');
  const [gridView,    setGridView]    = useState(true);
  const [grantStage,  setGrantStage]  = useState<GrantStageFilter>('All');
  const [grantSearch, setGrantSearch] = useState('');

  const isLoading = startupsLoading || extraLoading;

  const getMilestones   = (id: string) => milestones.filter(m => m.startup_id === id);
  const getProgress     = (id: string) => {
    const ms = getMilestones(id);
    return ms.length ? Math.round((ms.filter(m => m.status === 'completed').length / ms.length) * 100) : 0;
  };
  const getStartupLikes = (id: string) => startupLikes.filter(l => l.startup_id === id);

  const foundersCount   = Object.keys(founders).length;
  const totalMilestones = milestones.length;

  const filtered = useMemo(() => {
    let list = startups.filter(s => {
      const q = search.toLowerCase();
      return (
        (!q || s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)) &&
        (stageFilter === 'All' || s.stage === stageFilter)
      );
    });
    if      (sortKey === 'trending') list = [...list].sort((a, b) => getStartupLikes(b.id).length - getStartupLikes(a.id).length);
    else if (sortKey === 'progress') list = [...list].sort((a, b) => getProgress(b.id) - getProgress(a.id));
    else                             list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startups, search, stageFilter, sortKey, startupLikes, milestones]);

  const filteredGrants = useMemo(() => GRANTS.filter(g => {
    const q = grantSearch.toLowerCase();
    return (
      (!q || g.name.toLowerCase().includes(q) || g.org.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)) &&
      (grantStage === 'All' || g.stage.includes(grantStage))
    );
  }), [grantSearch, grantStage]);

  const spotlight = useMemo(
    () => startups.length
      ? [...startups].sort((a, b) => getStartupLikes(b.id).length - getStartupLikes(a.id).length)[0]
      : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startups, startupLikes],
  );

  return (
    <div className="min-h-screen bg-background">
      <style>{STYLES}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-primary/70 text-primary-foreground">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 15% 50%, white 0%, transparent 50%),
                            radial-gradient(circle at 85% 30%, white 0%, transparent 40%)`,
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative max-w-3xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold mb-5 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" /> Student Startup Showcase
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Where ideas become<br /><span className="opacity-80">real companies.</span>
          </h1>
          <p className="text-base text-primary-foreground/70 max-w-md mx-auto">
            Discover student-built startups, follow their journey, find grants, and celebrate milestones together.
          </p>
          <div className="grid grid-cols-4 gap-3 mt-10 max-w-lg mx-auto">
            {[
              { label: 'Startups',   value: startups.length },
              { label: 'Founders',   value: foundersCount },
              { label: 'Milestones', value: totalMilestones },
              { label: 'Grants',     value: GRANTS.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 border border-white/15 rounded-2xl py-3 px-2 backdrop-blur-sm">
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="text-[11px] text-primary-foreground/60 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* ── SPOTLIGHT ──────────────────────────────────────── */}
        {spotlight && !isLoading && (
          <div
            className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background cursor-pointer group shadow-sm hover:shadow-md transition-all"
            onClick={() => setSelected(spotlight)}
          >
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                <Star className="h-3 w-3 fill-current" /> Spotlight
              </span>
            </div>
            <div className="p-5 flex items-center gap-5">
              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${getGradient(spotlight.id)} border border-border/40 flex items-center justify-center shrink-0`}>
                <Rocket className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-1">Most liked startup</p>
                <h3 className="font-bold text-lg leading-tight truncate">{spotlight.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{spotlight.description || 'No description.'}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="flex items-center gap-1 text-sm font-semibold text-destructive">
                  <Heart className="h-4 w-4 fill-current" /> {getStartupLikes(spotlight.id).length}
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* ── TABS ───────────────────────────────────────────── */}
        <Tabs defaultValue="feed" className="space-y-5">
          <TabsList className="w-full h-auto p-1 bg-muted/40 border border-border/60 rounded-2xl">
            <TabsTrigger value="feed" className="flex-1 gap-2 rounded-xl py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Flame className="h-3.5 w-3.5" /> Feed
            </TabsTrigger>
            <TabsTrigger value="startups" className="flex-1 gap-2 rounded-xl py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Rocket className="h-3.5 w-3.5" /> Startups
              <span className="text-[11px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{startups.length}</span>
            </TabsTrigger>
            <TabsTrigger value="grants" className="flex-1 gap-2 rounded-xl py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <DollarSign className="h-3.5 w-3.5" /> Grants
              <span className="text-[11px] font-bold bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 rounded-full">{GRANTS.length}</span>
            </TabsTrigger>
          </TabsList>

          {/* ── FEED TAB ─────────────────────────────────────── */}
          <TabsContent value="feed" className="space-y-4">
            {user && <FeedComposer user={user} />}

            {/* Stories-style avatar bar */}
            {!postsLoading && Object.keys(founders).length > 0 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {Object.entries(founders).slice(0, 8).map(([id, name]) => {
                  const n      = name as string;
                  const ini    = toInitials(n);
                  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6'];
                  const color  = colors[id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
                  return (
                    <div key={id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
                      <div
                        className="h-11 w-11 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-primary/30 ring-offset-1 ring-offset-background"
                        style={{ background: color }}
                      >
                        {ini}
                      </div>
                      <p className="text-[10px] text-muted-foreground w-11 text-center truncate">
                        {n.split(' ')[0]}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {postsLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
              </div>
            )}

            {!postsLoading && posts.length === 0 && (
              <EmptyState
                icon={<Flame className="h-8 w-8" />}
                title="No posts yet"
                subtitle={user ? 'Be the first to share a milestone or update!' : 'Sign in to start posting.'}
              />
            )}

            {!postsLoading && posts.length > 0 && (
              <div className="space-y-3">
                {posts.map(p => (
                  <FeedPost key={p.id} post={p} currentUserId={user?.id} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── STARTUPS TAB ─────────────────────────────────── */}
          <TabsContent value="startups" className="space-y-5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search startups…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-10 rounded-xl h-10 border-border/60 bg-muted/30 focus:bg-background"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 shrink-0">
                <Filter className="h-3 w-3" /> Stage:
              </span>
              {ALL_STAGES.map(stage => (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stage)}
                  className={cn(
                    'text-xs px-3 py-1 rounded-full border font-medium transition-all',
                    stageFilter === stage
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground bg-background',
                  )}
                >
                  {stage === 'All' ? 'All' : STAGE_CONFIG[stage]?.label ?? stage}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-muted/40 border border-border/60 rounded-xl p-1">
                {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setSortKey(value)}
                    className={cn(
                      'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all',
                      sortKey === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="h-3 w-3" /> {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 border border-border/60 rounded-xl p-1 bg-muted/40">
                <button
                  onClick={() => setGridView(true)}
                  className={cn('p-1.5 rounded-lg transition-all', gridView ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setGridView(false)}
                  className={cn('p-1.5 rounded-lg transition-all', !gridView ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {!isLoading && (
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filtered.length}</span> startup{filtered.length !== 1 ? 's' : ''}
                {stageFilter !== 'All' && <> in <span className="font-semibold text-foreground">{STAGE_CONFIG[stageFilter]?.label}</span></>}
                {search && <> matching "<span className="font-semibold text-foreground">{search}</span>"</>}
              </p>
            )}

            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <EmptyState
                icon={<Rocket className="h-8 w-8" />}
                title={search ? 'No matches found' : 'No startups yet'}
                subtitle={search ? 'Try a different search.' : 'Be the first!'}
                action={search
                  ? <Button size="sm" variant="outline" className="rounded-full mt-3" onClick={() => { setSearch(''); setStageFilter('All'); }}>Clear filters</Button>
                  : undefined}
              />
            )}

            {!isLoading && filtered.length > 0 && (
              <div className={gridView ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'flex flex-col gap-3'}>
                {filtered.map(startup => {
                  const founderName = founders[startup.student_id || ''] || 'Unknown';
                  const pct         = getProgress(startup.id);
                  const ms          = getMilestones(startup.id);
                  const sLikes      = getStartupLikes(startup.id);
                  const liked       = sLikes.some(l => l.user_id === user?.id);
                  const gradient    = getGradient(startup.id);
                  const props: CardProps = {
                    startup, founderName, pct, ms, sLikes, liked, gradient, user,
                    onOpen:    () => setSelected(startup),
                    onLike:    () => user && toggleStartupLike.mutate(startup.id),
                    isPending: toggleStartupLike.isPending,
                  };
                  return gridView
                    ? <StartupGridCard key={startup.id} {...props} />
                    : <StartupListRow  key={startup.id} {...props} />;
                })}
              </div>
            )}
          </TabsContent>

          {/* ── GRANTS TAB ───────────────────────────────────── */}
          <TabsContent value="grants" className="space-y-5">
            {/* Header banner */}
            <div className="relative overflow-hidden rounded-2xl p-5 bg-emerald-500/5 border border-emerald-500/20">
              <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-emerald-500/8 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <DollarSign className="h-2.5 w-2.5 text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                    Funding Opportunities
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1">Grants & Funding for Founders</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Curated grants, fellowships and funding programmes for African startup founders. Filter by your current stage.
                </p>
              </div>
            </div>

            {/* Search + stage filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search grants, orgs or keywords…"
                  value={grantSearch}
                  onChange={e => setGrantSearch(e.target.value)}
                  className="pl-10 pr-10 rounded-xl h-10 border-border/60 bg-muted/30 focus:bg-background"
                />
                {grantSearch && (
                  <button onClick={() => setGrantSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 shrink-0">
                  <Filter className="h-3 w-3" /> Your stage:
                </span>
                {(['All', 'idea', 'mvp', 'growth', 'scaling', 'established'] as GrantStageFilter[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setGrantStage(s)}
                    className={cn(
                      'text-xs px-3 py-1 rounded-full border font-medium transition-all capitalize',
                      grantStage === s
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'border-border/60 text-muted-foreground hover:border-emerald-500/40 hover:text-foreground bg-background',
                    )}
                  >
                    {s === 'All' ? 'All stages' : s}
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredGrants.length}</span> grant{filteredGrants.length !== 1 ? 's' : ''} available
                {grantStage !== 'All' && <> for <span className="font-semibold text-foreground capitalize">{grantStage}</span> stage</>}
              </p>
            </div>

            {filteredGrants.length === 0 ? (
              <EmptyState
                icon={<DollarSign className="h-8 w-8" />}
                title="No grants match your filters"
                subtitle="Try a different stage or clear the search."
                action={
                  <Button size="sm" variant="outline" className="rounded-full mt-3"
                    onClick={() => { setGrantStage('All'); setGrantSearch(''); }}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col gap-4">
                {filteredGrants.map((grant, i) => (
                  <GrantCard key={grant.id} grant={grant} index={i} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── STARTUP DETAIL DIALOG ────────────────────────────── */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        {selected && (
          <StartupDetailDialog
            selected={selected}
            founders={founders}
            milestones={milestones}
            startupLikes={startupLikes}
            user={user}
            toggleStartupLike={toggleStartupLike}
          />
        )}
      </Dialog>
    </div>
  );
}