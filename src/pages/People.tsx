import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Search, MessageSquare, ExternalLink, GraduationCap,
  Shield, Users, X, MapPin, Globe, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── helpers ─────────────────────────────────────────────── */
function initialsOf(name: string) {
  return (name ?? '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
}

const roleConfig = {
  student: {
    label: 'Student',
    icon: GraduationCap,
    badge: 'bg-warning/15 text-warning border-warning/30',
    avatarRing: 'ring-warning/30',
    stripe: 'from-warning/40 via-warning/10 to-transparent',
  },
  mentor: {
    label: 'Mentor',
    icon: Sparkles,
    badge: 'bg-success/15 text-success border-success/30',
    avatarRing: 'ring-success/30',
    stripe: 'from-success/40 via-success/10 to-transparent',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    badge: 'bg-primary/15 text-primary border-primary/30',
    avatarRing: 'ring-primary/30',
    stripe: 'from-primary/40 via-primary/10 to-transparent',
  },
} as const;

type Role = keyof typeof roleConfig;

/* ─── styles injected once ─────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('people-styles')) {
  const el = document.createElement('style');
  el.id = 'people-styles';
  el.textContent = `
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .person-card { animation: cardIn 0.25s ease both; }
    .person-card .card-actions { opacity: 0; transform: translateY(4px); transition: opacity 0.18s ease, transform 0.18s ease; }
    .person-card:hover .card-actions { opacity: 1; transform: translateY(0); }
  `;
  document.head.appendChild(el);
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function People() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | Role>('all');

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people-directory'],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from('profiles').select('*').eq('profile_completed', true),
        supabase.from('user_roles').select('user_id, role'),
      ]);
      const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role as string]));
      return (profiles ?? []).map((p: any) => ({
        ...p,
        role: roleMap.get(p.user_id) ?? 'student',
      }));
    },
  });

  const counts = useMemo(() => ({
    all: people.length,
    student: people.filter((p) => p.role === 'student').length,
    mentor: people.filter((p) => p.role === 'mentor').length,
    admin: people.filter((p) => p.role === 'admin').length,
  }), [people]);

  const filtered = useMemo(() => people.filter((p) => {
    if (activeTab !== 'all' && p.role !== activeTab) return false;
    if (search && !p.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [people, search, activeTab]);

  const tabs: { value: 'all' | Role; label: string; count: number }[] = [
    { value: 'all', label: 'Everyone', count: counts.all },
    { value: 'mentor', label: 'Mentors', count: counts.mentor },
    { value: 'student', label: 'Students', count: counts.student },
    { value: 'admin', label: 'Admins', count: counts.admin },
  ];

  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl md:text-3xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            People
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover and connect with everyone in the program.
          </p>
        </div>

        {/* Community summary pill */}
        {!isLoading && people.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/60 shrink-0">
            <div className="flex -space-x-2">
              {people.slice(0, 4).map((p, i) => (
                <div
                  key={p.user_id}
                  className="h-6 w-6 rounded-full bg-gradient-aurora ring-2 ring-background flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ zIndex: 4 - i }}
                >
                  {initialsOf(p.full_name)}
                </div>
              ))}
            </div>
            <span className="text-xs font-semibold">{people.length}</span>
            <span className="text-xs text-muted-foreground">members</span>
          </div>
        )}
      </div>

      {/* ── Search + Filter row ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="pl-9 h-10 rounded-xl bg-card border-border/60 focus:border-primary/40 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-card border border-border/60">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                activeTab === t.value
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
              )}
            >
              {t.label}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums",
                activeTab === t.value ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
              )}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Result count ── */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground -mt-3">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'person' : 'people'}
          {search && <> matching <span className="font-semibold text-foreground">"{search}"</span></>}
        </p>
      )}

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card overflow-hidden animate-pulse">
              <div className="h-16 bg-muted/60" />
              <div className="p-4 space-y-3 -mt-6">
                <div className="h-12 w-12 rounded-full bg-muted ring-4 ring-background" />
                <div className="space-y-2 pt-1">
                  <div className="h-3.5 bg-muted rounded-full w-3/4" />
                  <div className="h-2.5 bg-muted rounded-full w-1/2" />
                </div>
                <div className="h-2 bg-muted rounded-full" />
                <div className="h-2 bg-muted rounded-full w-4/5" />
                <div className="h-8 bg-muted rounded-xl mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card/50 py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground/70">No one found</p>
          <p className="text-sm text-muted-foreground mt-1.5">
            {search ? `Nothing matches "${search}"` : 'No members in this group yet'}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="mt-4 text-sm text-primary hover:underline">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((person, idx) => (
            <PersonCard
              key={person.user_id}
              person={person}
              idx={idx}
              isMe={person.user_id === user?.id}
              onViewProfile={() => setSelectedUser(person)}
            />
          ))}
        </div>
      )}

      {/* ── Profile modal ── */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
        {selectedUser && (
          <ProfileModal person={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </Dialog>
    </div>
  );
}

/* ─── Person Card ──────────────────────────────────────────── */
function PersonCard({
  person, idx, isMe, onViewProfile,
}: {
  person: any;
  idx: number;
  isMe: boolean;
  onViewProfile: () => void;
}) {
  const role = (person.role ?? 'student') as Role;
  const cfg = roleConfig[role] ?? roleConfig.student;
  const Icon = cfg.icon;

  return (
    <div
      className="person-card rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-200 flex flex-col cursor-pointer"
      style={{ animationDelay: `${Math.min(idx * 35, 280)}ms` }}
      onClick={onViewProfile}
    >
      {/* Coloured banner with role watermark */}
      <div className={cn(
        "h-16 w-full relative bg-gradient-to-r shrink-0",
        cfg.stripe,
      )}>
        <div className="absolute right-2 top-2 opacity-[0.15]">
          <Icon className="h-10 w-10" />
        </div>
        {isMe && (
          <span className="absolute top-2.5 left-3 text-[9px] font-bold uppercase tracking-widest bg-background/70 backdrop-blur-sm text-foreground px-2 py-0.5 rounded-full border border-border/40">
            You
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pb-4 flex flex-col flex-1 -mt-6">
        {/* Avatar row */}
        <div className="flex items-end justify-between mb-3">
          <div className="relative">
            <Avatar className={cn("h-12 w-12 ring-4 ring-background shadow-md", cfg.avatarRing)}>
              {person.avatar_url && <AvatarImage src={person.avatar_url} />}
              <AvatarFallback className="bg-gradient-aurora text-white text-sm font-bold">
                {initialsOf(person.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
          </div>
          <Badge
            variant="outline"
            className={cn("text-[10px] capitalize gap-1 shrink-0 mb-0.5", cfg.badge)}
          >
            <Icon className="h-2.5 w-2.5" />
            {cfg.label}
          </Badge>
        </div>

        {/* Name */}
        <p className="font-semibold text-sm leading-snug mb-1 truncate">{person.full_name}</p>

        {/* Bio */}
        <p className={cn(
          "text-xs leading-relaxed line-clamp-2 mb-3 flex-1",
          person.bio ? "text-muted-foreground" : "text-muted-foreground/40 italic",
        )}>
          {person.bio || 'No bio yet'}
        </p>

        {/* Skills chips */}
        {person.skills && Array.isArray(person.skills) && person.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {person.skills.slice(0, 2).map((s: string) => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 rounded-full bg-accent/60 text-muted-foreground border border-border/40"
              >
                {s}
              </span>
            ))}
            {person.skills.length > 2 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                +{person.skills.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Action buttons — fade in on card hover */}
        <div
          className="card-actions flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-8 rounded-xl text-xs font-medium bg-primary/8 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all"
            onClick={onViewProfile}
          >
            View Profile
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 rounded-xl shrink-0 text-muted-foreground hover:text-foreground border-border/60"
            asChild
          >
            <Link to={`/messages?start=${person.user_id}`} title="Send message">
              <MessageSquare className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Modal ────────────────────────────────────────── */
function ProfileModal({ person, onClose }: { person: any; onClose: () => void }) {
  const role = (person.role ?? 'student') as Role;
  const cfg = roleConfig[role] ?? roleConfig.student;
  const Icon = cfg.icon;

  return (
    <DialogContent className="max-w-sm p-0 rounded-2xl overflow-hidden border-border/60 gap-0">
      {/* Banner */}
      <div className={cn(
        "h-24 w-full relative bg-gradient-to-br shrink-0",
        cfg.stripe,
      )}>
        <div className="absolute right-4 top-4 opacity-10">
          <Icon className="h-16 w-16" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 h-7 w-7 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-5 pb-6 -mt-7">
        {/* Avatar + badge */}
        <div className="flex items-end justify-between mb-4">
          <Avatar className={cn("h-14 w-14 ring-4 ring-background shadow-lg", cfg.avatarRing)}>
            {person.avatar_url && <AvatarImage src={person.avatar_url} />}
            <AvatarFallback className="bg-gradient-aurora text-white font-bold text-base">
              {initialsOf(person.full_name)}
            </AvatarFallback>
          </Avatar>
          <Badge variant="outline" className={cn("text-[10px] capitalize gap-1 mb-1", cfg.badge)}>
            <Icon className="h-2.5 w-2.5" />
            {cfg.label}
          </Badge>
        </div>

        {/* Name + email */}
        <p className="font-semibold text-base leading-tight">{person.full_name}</p>
        {person.email && (
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">{person.email}</p>
        )}

        {/* Bio */}
        {person.bio && (
          <div className="mb-4 p-3 rounded-xl bg-accent/30 border border-border/40">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">About</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{person.bio}</p>
          </div>
        )}

        {/* Skills */}
        {person.skills && Array.isArray(person.skills) && person.skills.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {person.skills.map((s: string) => (
                <span
                  key={s}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border/50 text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Location / website */}
        {(person.location || person.website) && (
          <div className="flex flex-wrap gap-3 mb-5">
            {person.location && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {person.location}
              </span>
            )}
            {person.website && (
              <a
                href={person.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                <Globe className="h-3 w-3" /> Website
              </a>
            )}
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-2">
          <Button
            asChild
            size="sm"
            className="flex-1 h-9 rounded-xl text-xs font-medium bg-gradient-aurora shadow-glow text-white"
          >
            <Link to={`/profile/${person.user_id}`}>
              Full Profile <ExternalLink className="h-3 w-3 ml-1.5" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-9 w-9 p-0 rounded-xl border-border/60">
            <Link to={`/messages?start=${person.user_id}`} title="Message">
              <MessageSquare className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}