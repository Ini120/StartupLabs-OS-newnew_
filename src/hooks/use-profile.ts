import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useInvokeEdge } from '@/lib/invoke-edge';

export interface ProfileData {
  user_id: string;
  full_name: string;
  bio: string;
  department: string;
  level: string;
  avatar_url: string;
  headline: string;
  location: string;
  github_url: string;
  linkedin_url: string;
  website_url: string;
  twitter_url: string;
  role: string | null;
}

export function useProfile(userId: string | null | undefined) {
  return useQuery<ProfileData | null>({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const [{ data: profile }, { data: roleRow }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
      ]);
      if (!profile) return null;
      return {
        user_id: profile.user_id,
        full_name: profile.full_name ?? '',
        bio: profile.bio ?? '',
        department: profile.department ?? '',
        level: profile.level ?? '',
        avatar_url: profile.avatar_url ?? '',
        headline: (profile as any).headline ?? '',
        location: (profile as any).location ?? '',
        github_url: (profile as any).github_url ?? '',
        linkedin_url: (profile as any).linkedin_url ?? '',
        website_url: (profile as any).website_url ?? '',
        twitter_url: (profile as any).twitter_url ?? '',
        role: (roleRow?.role as string) ?? null,
      };
    },
  });
}

export function useUserProjects(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['user-projects', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUserSkills(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['user-skills', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUserAchievements(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['user-achievements', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId!)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUserActivity(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['user-activity', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type FollowState = 'self' | 'not_following' | 'pending' | 'accepted';

export function useFollowState(targetUserId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['follow-state', user?.id, targetUserId],
    enabled: !!user && !!targetUserId,
    queryFn: async (): Promise<{ state: FollowState; followId: string | null }> => {
      if (!user || !targetUserId) return { state: 'not_following', followId: null };
      if (user.id === targetUserId) return { state: 'self', followId: null };
      const { data } = await supabase
        .from('follows')
        .select('id, status')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();
      if (!data) return { state: 'not_following', followId: null };
      return { state: data.status as FollowState, followId: data.id };
    },
  });
}

export function useFollowCounts(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['follow-counts', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId!)
          .eq('status', 'accepted'),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId!)
          .eq('status', 'accepted'),
      ]);
      return { followers: followers ?? 0, following: following ?? 0 };
    },
  });
}

export interface PendingFollowRequest {
  id: string;
  follower_id: string;
  follower_name: string;
  follower_avatar: string | null;
  follower_role: string | null;
  created_at: string;
}

export function usePendingFollowRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PendingFollowRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rows } = await supabase
      .from('follows')
      .select('id, follower_id, created_at')
      .eq('following_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!rows || rows.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }
    const followerIds = rows.map((r) => r.follower_id);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', followerIds),
      supabase.from('user_roles').select('user_id, role').in('user_id', followerIds),
    ]);
    const pMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    const rMap = new Map((roles ?? []).map((r) => [r.user_id, r.role as string]));
    setRequests(
      rows.map((r) => ({
        id: r.id,
        follower_id: r.follower_id,
        follower_name: pMap.get(r.follower_id)?.full_name ?? 'Unknown',
        follower_avatar: pMap.get(r.follower_id)?.avatar_url ?? null,
        follower_role: rMap.get(r.follower_id) ?? null,
        created_at: r.created_at,
      })),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('follow-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows', filter: `following_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  return { requests, loading, reload: load };
}

export function useUserStartups(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['user-startups', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_startups')
        .select('*')
        .eq('user_id', userId!)
        .order('founded_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSocialActions() {
  const invoke = useInvokeEdge();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const follow = useMutation({
    mutationFn: async (targetUserId: string) => {
      const r = await invoke('manage-social', { action: 'follow', target_user_id: targetUserId });
      if (r.error) throw r.error;
    },
    onSuccess: (_d, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['follow-state', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['follow-counts'] });
    },
  });

  const unfollow = useMutation({
    mutationFn: async (targetUserId: string) => {
      const r = await invoke('manage-social', { action: 'unfollow', target_user_id: targetUserId });
      if (r.error) throw r.error;
    },
    onSuccess: (_d, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['follow-state', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['follow-counts'] });
    },
  });

  const respondFollow = useMutation({
    mutationFn: async ({ followId, accept }: { followId: string; accept: boolean }) => {
      const r = await invoke('manage-social', { action: 'respond_follow', follow_id: followId, accept });
      if (r.error) throw r.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-counts'] });
    },
  });

  return { follow, unfollow, respondFollow };
}