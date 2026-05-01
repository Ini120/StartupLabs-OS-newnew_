import { useQuery } from '@tanstack/react-query';
import { Bell, CheckCircle2, ExternalLink, UserPlus, Check, X, Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePendingFollowRequests, useSocialActions } from '@/hooks/use-profile';
import { useNotifications, useMarkNotificationsRead, NotificationRow } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const { role } = useAuth();
  const { requests: followRequests, reload } = usePendingFollowRequests();
  const { respondFollow } = useSocialActions();
  const { data: notifs = [] } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const { data: pending = [] } = useQuery({
    queryKey: ['notifications', 'pending-assignments'],
    enabled: role === 'admin' || role === 'super_admin',
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_assignments')
        .select('id, student_id, mentor_id, created_at, assigned_by')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['notifications', 'profile-names'],
    enabled: (role === 'admin' || role === 'super_admin') && pending.length > 0,
    queryFn: async () => {
      const ids = Array.from(new Set(pending.flatMap((p) => [p.student_id, p.mentor_id])));
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', ids);
      if (error) throw error;
      return data ?? [];
    },
  });

  const nameOf = (id: string) => profiles.find((p) => p.user_id === id)?.full_name || `${id.slice(0, 8)}…`;

  const unreadNotifs = notifs.filter((n) => !n.read_at);
  const adminCount = (role === 'admin' || role === 'super_admin') ? pending.length : 0;
  const total = adminCount + followRequests.length + unreadNotifs.length;

  const handleRespond = async (followId: string, accept: boolean) => {
    await respondFollow.mutateAsync({ followId, accept });
    reload();
  };

  const handleOpen = (open: boolean) => {
    if (open && unreadNotifs.length > 0) {
      markRead.mutate(unreadNotifs.map((n) => n.id));
    }
  };

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-xl hover:bg-accent"
          aria-label={`Notifications${total > 0 ? `, ${total} pending` : ''}`}
        >
          <Bell className="h-[18px] w-[18px]" />
          {total > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-glow">
              {total > 9 ? '9+' : total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 overflow-hidden">
        <div className="border-b border-border/60 bg-gradient-subtle px-4 py-3">
          <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
            Notifications
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {total === 0 ? 'You\'re all caught up.' : `${total} thing${total > 1 ? 's' : ''} need your attention`}
          </p>
        </div>

        <div className="max-h-[460px] overflow-y-auto">
          {total === 0 && notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <p className="text-sm font-medium">All clear</p>
              <p className="text-xs text-muted-foreground">No new notifications.</p>
            </div>
          ) : (
            <>
              {/* Follow requests */}
              {followRequests.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <UserPlus className="h-3 w-3" /> Follow requests
                  </div>
                  <ul className="divide-y divide-border/60">
                    {followRequests.map((r) => {
                      const initials = r.follower_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <li key={r.id} className="px-4 py-3 flex items-center gap-3 hover:bg-accent/50 transition-smooth">
                          <Link to={`/profile/${r.follower_id}`}>
                            <Avatar className="h-9 w-9">
                              {r.follower_avatar && <AvatarImage src={r.follower_avatar} />}
                              <AvatarFallback className="bg-gradient-aurora text-primary-foreground text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-tight">
                              <Link to={`/profile/${r.follower_id}`} className="font-semibold hover:underline">
                                {r.follower_name}
                              </Link>{' '}
                              <span className="text-muted-foreground">wants to follow you</span>
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-success hover:bg-success/10" onClick={() => handleRespond(r.id, true)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRespond(r.id, false)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Likes & comments */}
              {notifs.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Activity
                  </div>
                  <ul className="divide-y divide-border/60">
                    {notifs.slice(0, 20).map((n) => <NotifRow key={n.id} n={n} />)}
                  </ul>
                </div>
              )}

              {/* Pending assignments (admin only) */}
              {adminCount > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Mentor assignments
                  </div>
                  <ul className="divide-y divide-border/60">
                    {pending.map((p) => (
                      <li key={p.id} className="px-4 py-3 hover:bg-accent/50 transition-smooth">
                        <p className="text-sm leading-snug">
                          <span className="font-semibold">{nameOf(p.student_id)}</span>{' '}
                          <span className="text-muted-foreground">was auto-assigned to</span>{' '}
                          <span className="font-semibold">{nameOf(p.mentor_id)}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {new Date(p.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-border/60 bg-muted/30 p-2">
                    <Button asChild size="sm" variant="ghost" className="w-full justify-between">
                      <Link to="/mentor-assignments">
                        Review all assignments <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotifRow({ n }: { n: NotificationRow }) {
  const { data: actor } = useQuery({
    queryKey: ['profile-mini', n.actor_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles').select('full_name, avatar_url')
        .eq('user_id', n.actor_id).maybeSingle();
      return data;
    },
  });

  const initials = (actor?.full_name || n.actor_id).split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  const isLike = n.type.startsWith('like');
  const Icon = isLike ? Heart : MessageCircle;
  const iconColor = isLike ? 'text-destructive' : 'text-primary';

  const target = n.post_id ? '/showcase' : n.startup_id ? '/showcase' : '/';

  return (
    <li className={`px-4 py-3 flex items-start gap-3 hover:bg-accent/50 transition-smooth ${!n.read_at ? 'bg-primary/5' : ''}`}>
      <Link to={`/profile/${n.actor_id}`} className="shrink-0 relative">
        <Avatar className="h-9 w-9">
          {actor?.avatar_url && <AvatarImage src={actor.avatar_url} />}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-card border border-border flex items-center justify-center">
          <Icon className={`h-2.5 w-2.5 ${iconColor} ${isLike ? 'fill-current' : ''}`} />
        </span>
      </Link>
      <Link to={target} className="flex-1 min-w-0">
        <p className="text-sm leading-snug line-clamp-2">{n.message}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
        </p>
      </Link>
    </li>
  );
}
