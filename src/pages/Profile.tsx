import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  useProfile, useUserProjects, useUserSkills, useUserAchievements, useUserActivity,
  useFollowState, useFollowCounts, useSocialActions, useUserStartups,
} from '@/hooks/use-profile';
import { useStartConversation } from '@/hooks/use-chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { ManageProjectsDialog } from '@/components/profile/ManageProjectsDialog';
import { ManageSkillsDialog } from '@/components/profile/ManageSkillsDialog';
import { ManageAchievementsDialog } from '@/components/profile/ManageAchievementsDialog';
import {
  MapPin, Github, Linkedin, Globe, Twitter, MessageSquare, UserPlus, UserCheck,
  Clock, Pencil, Trophy, Sparkles, Briefcase, Activity, Award, ExternalLink,
  FolderKanban, FileText, ArrowUpRight, Star, Zap, Rocket, CalendarDays, Tag,
  BarChart3, Users, CheckCircle2, Target, TrendingUp, X,
} from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PostCard } from '@/components/showcase/PostCard';
import type { ShowcasePost } from '@/hooks/use-social-feed';

export default function Profile() {
  const { userId: urlUserId } = useParams<{ userId: string }>();
  const { user: me } = useAuth();
  const userId = urlUserId ?? me?.id ?? null;
  const isMe = !!me && userId === me.id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: profile, isLoading } = useProfile(userId);
  const { data: projects = [] } = useUserProjects(userId);
  const { data: skills = [] } = useUserSkills(userId);
  const { data: achievements = [] } = useUserAchievements(userId);
  const { data: activity = [] } = useUserActivity(userId);
  const { data: followState } = useFollowState(userId);
  const { data: counts } = useFollowCounts(userId);
  const { follow, unfollow } = useSocialActions();
  const startConversation = useStartConversation();

  const [editOpen, setEditOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);

  if (isLoading || !profile) {
    return (
      <div className="animate-pulse">
        <Skeleton className="h-52 w-full" />
        <div className="px-6 space-y-4 mt-4">
          <Skeleton className="h-28 w-28 rounded-full" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const initials =
    profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const handleMessage = async () => {
    if (!userId) return;
    const id = await startConversation(userId);
    if (id) navigate(`/messages?c=${id}`);
    else toast({ title: 'Could not start chat', variant: 'destructive' });
  };

  const handleFollow = async () => {
    if (!userId) return;
    if (followState?.state === 'accepted' || followState?.state === 'pending') {
      await unfollow.mutateAsync(userId);
      toast({ title: followState.state === 'pending' ? 'Request canceled' : 'Unfollowed' });
    } else {
      await follow.mutateAsync(userId);
      toast({ title: 'Follow request sent' });
    }
  };

  const followLabel =
    followState?.state === 'accepted' ? 'Following'
    : followState?.state === 'pending' ? 'Requested'
    : 'Follow';

  const FollowIcon =
    followState?.state === 'accepted' ? UserCheck
    : followState?.state === 'pending' ? Clock
    : UserPlus;

  const isFollowing = followState?.state === 'accepted' || followState?.state === 'pending';

  return (
    <div className="min-h-screen bg-background pb-16">

      {/* ── COVER BANNER ── */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-primary/80 via-primary to-primary/60">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, hsl(var(--primary-glow)) 0%, transparent 60%),
                              radial-gradient(circle at 80% 20%, hsl(var(--primary)) 0%, transparent 50%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {isMe && (
          <button
            onClick={() => setEditOpen(true)}
            className="absolute top-4 right-4 flex items-center gap-1.5 text-white/70 hover:text-white text-xs bg-black/20 hover:bg-black/35 px-3 py-1.5 rounded-full transition-all backdrop-blur-sm"
          >
            <Pencil className="h-3 w-3" /> Edit profile
          </button>
        )}
      </div>

      <div className="px-6">

        {/* ── AVATAR + ACTIONS ROW ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-14 mb-5 gap-4">
          <div className="relative w-fit">
            <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>

          <div className="flex items-center gap-2 sm:mb-2">
            {isMe ? (
              <Button onClick={() => setEditOpen(true)} variant="outline" size="sm" className="gap-2 rounded-full px-5 h-9 shadow-sm">
                <Pencil className="h-3.5 w-3.5" /> Edit profile
              </Button>
            ) : (
              <>
                <Button onClick={handleMessage} variant="outline" size="sm" className="gap-2 rounded-full px-4 h-9 shadow-sm">
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </Button>
                <Button
                  onClick={handleFollow}
                  size="sm"
                  disabled={follow.isPending || unfollow.isPending}
                  className={`gap-2 rounded-full px-5 h-9 shadow-sm transition-all ${
                    isFollowing
                      ? 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                      : 'bg-primary text-primary-foreground shadow-glow hover:opacity-90'
                  }`}
                >
                  <FollowIcon className="h-3.5 w-3.5" /> {followLabel}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── NAME + META ── */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              {profile.full_name || 'Unnamed'}
            </h1>
            {profile.role && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border">
                {profile.role}
              </Badge>
            )}
          </div>

          {profile.headline && (
            <p className="text-[15px] text-foreground/80 font-medium leading-snug">{profile.headline}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground">
            {profile.department && <span className="font-medium text-foreground/70">{profile.department}</span>}
            {profile.department && profile.level && <span className="text-border/80">·</span>}
            {profile.level && <span>{profile.level}</span>}
            {profile.location && (
              <>
                {(profile.department || profile.level) && <span className="text-border/80">·</span>}
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {profile.location}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── STATS STRIP ── */}
        <div className="grid grid-cols-4 mb-5 rounded-2xl bg-muted/40 border border-border/60 overflow-hidden divide-x divide-border/60">
          {[
            { label: 'Followers',  value: counts?.followers ?? 0 },
            { label: 'Following',  value: counts?.following ?? 0 },
            { label: 'Projects',   value: projects.length },
            { label: 'Awards',     value: achievements.length },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center py-3.5 px-2 hover:bg-muted/70 transition-colors cursor-default"
            >
              <span className="text-xl font-bold text-foreground leading-none">{s.value}</span>
              <span className="text-[11px] text-muted-foreground mt-1">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── SOCIAL LINKS ── */}
        {(profile.github_url || profile.linkedin_url || profile.website_url || profile.twitter_url) && (
          <div className="flex items-center flex-wrap gap-2 mb-6">
            {profile.github_url   && <SocialChip href={profile.github_url}   icon={<Github className="h-3.5 w-3.5" />}   label="GitHub" />}
            {profile.linkedin_url && <SocialChip href={profile.linkedin_url} icon={<Linkedin className="h-3.5 w-3.5" />} label="LinkedIn" />}
            {profile.twitter_url  && <SocialChip href={profile.twitter_url}  icon={<Twitter className="h-3.5 w-3.5" />}  label="Twitter" />}
            {profile.website_url  && <SocialChip href={profile.website_url}  icon={<Globe className="h-3.5 w-3.5" />}    label="Website" />}
          </div>
        )}

        {/* ── TABS ── */}
        <Tabs defaultValue="about" className="space-y-5">
          <TabsList className="w-full h-auto p-1 bg-muted/40 border border-border/60 rounded-2xl gap-0.5 flex-wrap">
            {[
              { value: 'about',        icon: Sparkles,  label: 'About' },
              { value: 'posts',        icon: FileText,  label: 'Posts' },
              { value: 'projects',     icon: Briefcase, label: 'Projects' },
              { value: 'startups',     icon: Rocket,    label: 'Startups' },
              { value: 'achievements', icon: Trophy,    label: 'Awards' },
              { value: 'activity',     icon: Activity,  label: 'Activity' },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex-1 gap-1.5 text-xs font-medium rounded-xl py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all min-w-0"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ABOUT */}
          <TabsContent value="about" className="space-y-4">
            <SectionCard
              title="Bio"
              action={isMe ? <IconEditBtn onClick={() => setEditOpen(true)} /> : null}
            >
              {profile.bio
                ? <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                : <p className="text-sm text-muted-foreground italic">No bio yet.</p>
              }
            </SectionCard>

            <SectionCard
              title="Skills"
              titleIcon={<Zap className="h-3.5 w-3.5 text-primary" />}
              action={isMe
                ? <Button size="sm" variant="ghost" onClick={() => setSkillsOpen(true)}
                    className="text-xs h-7 px-2.5 rounded-lg text-muted-foreground hover:text-foreground">Manage</Button>
                : null
              }
            >
              {skills.length === 0
                ? <p className="text-sm text-muted-foreground italic">No skills added yet.</p>
                : (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s: { id: string; name: string }) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 transition-colors"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                )
              }
            </SectionCard>
          </TabsContent>

          {/* POSTS */}
          <TabsContent value="posts" className="space-y-4">
            <UserPostsList userId={userId!} />
          </TabsContent>

          {/* PROJECTS */}
          <TabsContent value="projects" className="space-y-4">
            {isMe && (
              <div className="flex justify-end">
                <Button onClick={() => setProjectsOpen(true)} size="sm" className="gap-2 rounded-full px-4">
                  <FolderKanban className="h-3.5 w-3.5" /> Manage projects
                </Button>
              </div>
            )}
            {projects.length === 0
              ? <EmptyState icon={<Briefcase className="h-6 w-6" />} text="No projects yet." />
              : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((p: any) => <ProjectCard key={p.id} project={p} />)}
                </div>
              )
            }
          </TabsContent>

          {/* STARTUPS */}
          <TabsContent value="startups" className="space-y-4">
            <UserStartupsList userId={userId!} />
          </TabsContent>

          {/* ACHIEVEMENTS */}
          <TabsContent value="achievements" className="space-y-4">
            {isMe && (
              <div className="flex justify-end">
                <Button onClick={() => setAchievementsOpen(true)} size="sm" className="gap-2 rounded-full px-4">
                  <Trophy className="h-3.5 w-3.5" /> Manage achievements
                </Button>
              </div>
            )}
            {achievements.length === 0
              ? <EmptyState icon={<Trophy className="h-6 w-6" />} text="No achievements yet." />
              : (
                <div className="space-y-3">
                  {achievements.map((a: any, i: number) => (
                    <AchievementRow key={a.id} achievement={a} index={i} />
                  ))}
                </div>
              )
            }
          </TabsContent>

          {/* ACTIVITY */}
          <TabsContent value="activity" className="space-y-1 pb-4">
            {activity.length === 0
              ? <EmptyState icon={<Activity className="h-6 w-6" />} text="No activity yet." />
              : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-border/60" />
                  {activity.map((a: any) => <ActivityRow key={a.id} item={a} />)}
                </div>
              )
            }
          </TabsContent>
        </Tabs>
      </div>

      {/* DIALOGS */}
      {isMe && editOpen && profile && (
        <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} profile={profile} />
      )}
      {isMe && projectsOpen && (
        <ManageProjectsDialog open={projectsOpen} onOpenChange={setProjectsOpen} userId={userId!} />
      )}
      {isMe && skillsOpen && (
        <ManageSkillsDialog open={skillsOpen} onOpenChange={setSkillsOpen} userId={userId!} />
      )}
      {isMe && achievementsOpen && (
        <ManageAchievementsDialog open={achievementsOpen} onOpenChange={setAchievementsOpen} userId={userId!} />
      )}
    </div>
  );
}

/* ── SECTION CARD ── */
function SectionCard({
  title,
  titleIcon,
  action,
  children,
}: {
  title: string;
  titleIcon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          {titleIcon} {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

/* ── ICON EDIT BUTTON ── */
function IconEditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
}

/* ── SOCIAL CHIP ── */
function SocialChip({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href.startsWith('http') ? href : `https://${href}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/60 hover:bg-muted text-foreground/70 hover:text-foreground border border-border/60 transition-all hover:shadow-sm"
    >
      {icon} {label}
    </a>
  );
}

/* ── PROJECT CARD ── */
function ProjectCard({ project: p }: { project: any }) {
  return (
    <Card className="group overflow-hidden rounded-2xl border-border/60 shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-300">
      {p.cover_url ? (
        <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${p.cover_url})` }} />
      ) : (
        <div className="h-36 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center">
          <Briefcase className="h-10 w-10 text-primary/25" />
        </div>
      )}
      <CardContent className="p-5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-snug">{p.title}</h3>
          {p.stage && (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider shrink-0 rounded-full">
              {p.stage}
            </Badge>
          )}
        </div>
        {p.role && (
          <p className="text-xs font-semibold text-primary flex items-center gap-1">
            <Star className="h-3 w-3" /> {p.role}
          </p>
        )}
        {p.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{p.description}</p>
        )}
        <div className="flex items-center justify-between pt-1.5 border-t border-border/40 mt-1">
          <p className="text-[11px] text-muted-foreground">
            {p.started_at && format(new Date(p.started_at), 'MMM yyyy')}
            {p.ended_at && ` – ${format(new Date(p.ended_at), 'MMM yyyy')}`}
          </p>
          {p.link_url && (
            <a
              href={p.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
              Visit <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── ACHIEVEMENT ROW ── */
const trophyColors = [
  'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'bg-slate-400/10 text-slate-400 border-slate-400/20',
  'bg-orange-500/10 text-orange-600 border-orange-500/20',
];

function AchievementRow({ achievement: a, index }: { achievement: any; index: number }) {
  const colorClass = trophyColors[index % trophyColors.length];
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardContent className="p-4 flex items-start gap-4">
        <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${colorClass}`}>
          <Trophy className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm leading-snug">{a.title}</h4>
            {a.earned_at && (
              <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                {format(new Date(a.earned_at), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          {a.description && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── ACTIVITY ROW ── */
const activityMeta: Record<string, { emoji: string; color: string }> = {
  project_added:       { emoji: '📦', color: 'bg-blue-500/10 text-blue-500' },
  achievement_earned:  { emoji: '🏆', color: 'bg-amber-500/10 text-amber-500' },
  milestone_completed: { emoji: '✅', color: 'bg-emerald-500/10 text-emerald-500' },
};

function ActivityRow({ item: a }: { item: any }) {
  const meta = activityMeta[a.type] ?? { emoji: '✨', color: 'bg-primary/10 text-primary' };
  return (
    <div className="flex items-start gap-4 py-2.5">
      <div className={`relative z-10 h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-base ring-2 ring-background ${meta.color}`}>
        {meta.emoji}
      </div>
      <div className="flex-1 min-w-0 pt-1.5">
        <p className="text-sm font-medium leading-snug">{a.title}</p>
        {a.description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.description}</p>
        )}
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          {format(new Date(a.created_at), 'MMM d, yyyy · HH:mm')}
        </p>
      </div>
    </div>
  );
}

/* ── USER STARTUPS LIST ── */
/* ── STARTUP DETAIL MODAL ── */
function StartupDetailModal({ startup: s, open, onClose }: {
  startup: any; open: boolean; onClose: () => void;
}) {
  const meta = stageMeta[s.stage?.toLowerCase()] ?? { color: '#6366f1', glow: 'rgba(99,102,241,0.12)' };
  const stageClass = stageColors[s.stage?.toLowerCase()] ?? 'bg-muted text-muted-foreground border-border';

  // Fetch live milestones for this startup
  const { data: milestones = [], isLoading: loadingMilestones } = useQuery({
    queryKey: ['public-milestones', s.startup_id],
    enabled: open && !!s.startup_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('startup_id', s.startup_id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const completed  = milestones.filter((m: any) => m.status === 'completed');
  const inProgress = milestones.filter((m: any) => m.status === 'in-progress');
  const pending    = milestones.filter((m: any) => m.status === 'pending');
  const progress   = milestones.length ? Math.round((completed.length / milestones.length) * 100) : 0;

  const statusStyle: Record<string, { label: string; className: string }> = {
    'completed':   { label: 'Done',       className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    'in-progress': { label: 'In Progress', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    'pending':     { label: 'Pending',    className: 'bg-muted text-muted-foreground border-border' },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-border/60 gap-0">

        {/* ── HERO HEADER ── */}
        <div className="relative h-32 flex items-end p-5"
          style={{ background: `linear-gradient(135deg, ${meta.color}30, ${meta.color}10)` }}>
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(circle at 80% 50%, ${meta.glow}, transparent 70%)` }} />

          {/* Icon */}
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 mr-4"
            style={{ background: `${meta.color}20` }}>
            <Rocket className="h-6 w-6" style={{ color: meta.color }} />
          </div>

          <div className="relative flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold leading-tight">{s.name}</h2>
              {s.stage && (
                <Badge variant="outline" className={`text-[10px] uppercase tracking-wider rounded-full border ${stageClass}`}>
                  {s.stage}
                </Badge>
              )}
            </div>
            {s.industry && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Tag className="h-3 w-3" /> {s.industry}
              </p>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[70vh]">
          <div className="p-6 space-y-6">

            {/* ── DESCRIPTION ── */}
            {s.description && (
              <p className="text-sm text-foreground/80 leading-relaxed">{s.description}</p>
            )}

            {/* ── META ROW ── */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {s.founded_at && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Founded {format(new Date(s.founded_at), 'MMMM yyyy')}
                </span>
              )}
              {s.website_url && (
                <a href={s.website_url.startsWith('http') ? s.website_url : `https://${s.website_url}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline font-medium">
                  <Globe className="h-3.5 w-3.5" /> Visit Website
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* ── PROGRESS ── */}
            {milestones.length > 0 && (
              <div className="rounded-xl border border-border/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Overall Progress
                  </span>
                  <span className="text-sm font-black tabular-nums" style={{ color: meta.color }}>
                    {progress}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}99)` }} />
                </div>
                <div className="flex gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />{completed.length} completed</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />{inProgress.length} in progress</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 inline-block" />{pending.length} pending</span>
                </div>
              </div>
            )}

            {/* ── MILESTONES ── */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> Milestones
              </h3>
              {loadingMilestones ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
                </div>
              ) : milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No milestones yet.</p>
              ) : (
                <div className="space-y-2">
                  {milestones.map((m: any) => {
                    const st = statusStyle[m.status] ?? statusStyle['pending'];
                    return (
                      <div key={m.id}
                        className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                        <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border flex items-center justify-center ${st.className}`}>
                          {m.status === 'completed'
                            ? <CheckCircle2 className="h-3 w-3" />
                            : m.status === 'in-progress'
                            ? <Clock className="h-3 w-3" />
                            : <div className="h-1.5 w-1.5 rounded-full bg-current" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium leading-snug">{m.title}</p>
                            <Badge variant="outline" className={`text-[10px] shrink-0 rounded-full border ${st.className}`}>
                              {st.label}
                            </Badge>
                          </div>
                          {m.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                              {m.description}
                            </p>
                          )}
                          {m.due_date && (
                            <p className="text-[11px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              Due {format(new Date(m.due_date), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/* ── USER STARTUPS LIST ── */
function UserStartupsList({ userId }: { userId: string }) {
  const { data: startups = [], isLoading } = useUserStartups(userId);
  const [selected, setSelected] = useState<any | null>(null);

  if (isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  if (startups.length === 0)
    return <EmptyState icon={<Rocket className="h-6 w-6" />} text="No startups added to profile yet." />;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {startups.map((s: any) => (
          <StartupCard key={s.id} startup={s} onClick={() => setSelected(s)} />
        ))}
      </div>
      {selected && (
        <StartupDetailModal
          startup={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

/* ── STARTUP CARD ── */
const stageColors: Record<string, string> = {
  idea:       'bg-violet-500/10 text-violet-500 border-violet-500/20',
  validation: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  mvp:        'bg-blue-500/10 text-blue-500 border-blue-500/20',
  growth:     'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'series-a': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'series-b': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

const stageMeta: Record<string, { color: string; glow: string }> = {
  idea:       { color: '#8b5cf6', glow: 'rgba(139,92,246,0.12)' },
  validation: { color: '#f59e0b', glow: 'rgba(245,158,11,0.12)' },
  mvp:        { color: '#0ea5e9', glow: 'rgba(14,165,233,0.12)'  },
  growth:     { color: '#10b981', glow: 'rgba(16,185,129,0.12)' },
  'series-a': { color: '#f97316', glow: 'rgba(249,115,22,0.12)' },
  'series-b': { color: '#f43f5e', glow: 'rgba(244,63,94,0.12)'  },
};

function StartupCard({ startup: s, onClick }: { startup: any; onClick: () => void }) {
  const stageClass = stageColors[s.stage?.toLowerCase()] ?? 'bg-muted text-muted-foreground border-border';
  const meta = stageMeta[s.stage?.toLowerCase()] ?? { color: '#6366f1', glow: 'rgba(99,102,241,0.12)' };

  return (
    <div onClick={onClick} className="block group cursor-pointer">
      <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5">
        {/* Cover */}
        {s.logo_url ? (
          <div className="h-36 bg-cover bg-center relative overflow-hidden"
            style={{ backgroundImage: `url(${s.logo_url})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ) : (
          <div className="h-36 relative overflow-hidden flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${meta.color}18, ${meta.color}05)` }}>
            <Rocket className="h-10 w-10 transition-transform duration-300 group-hover:scale-110"
              style={{ color: `${meta.color}50` }} />
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60"
              style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }} />
          </div>
        )}

        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors">{s.name}</h3>
            {s.stage && (
              <Badge variant="outline" className={`text-[10px] uppercase tracking-wider shrink-0 rounded-full border ${stageClass}`}>
                {s.stage}
              </Badge>
            )}
          </div>
          {s.industry && (
            <p className="text-xs font-semibold text-primary flex items-center gap-1">
              <Tag className="h-3 w-3" /> {s.industry}
            </p>
          )}
          {s.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{s.description}</p>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              {s.founded_at && <><CalendarDays className="h-3 w-3" /> Founded {format(new Date(s.founded_at), 'MMM yyyy')}</>}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              View Details <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── EMPTY STATE ── */
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Card className="rounded-2xl border-border/60 border-dashed">
      <CardContent className="py-16 text-center flex flex-col items-center">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground/60">
          {icon}
        </div>
        <p className="text-sm font-medium text-muted-foreground">{text}</p>
        <p className="text-xs text-muted-foreground/50 mt-1">Nothing here yet.</p>
      </CardContent>
    </Card>
  );
}

/* ── USER POSTS LIST ── */
function UserPostsList({ userId }: { userId: string }) {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('showcase_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ShowcasePost[];
    },
  });

  if (isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  if (posts.length === 0) return <EmptyState icon={<FileText className="h-6 w-6" />} text="No posts yet." />;
  return (
    <div className="space-y-4">
      {posts.map((p) => <PostCard key={p.id} post={p} />)}
    </div>
  );
}