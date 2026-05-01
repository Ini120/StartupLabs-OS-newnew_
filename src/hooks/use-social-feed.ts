import { useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInvokeEdge } from '@/lib/invoke-edge';
import { useToast } from '@/hooks/use-toast';

export interface ShowcasePost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  startup_id: string | null;
  created_at: string;
}

export interface PostLike { id: string; post_id: string; user_id: string }
export interface StartupLike { id: string; startup_id: string; user_id: string }
export interface PostComment {
  id: string;
  post_id: string | null;
  startup_id: string | null;
  user_id: string;
  content: string;
  created_at: string;
}

/** Subscribes to all social tables and invalidates queries on change. */
export function useSocialRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase.channel('social-feed-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'showcase_posts' },
        () => qc.invalidateQueries({ queryKey: ['showcase-posts'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' },
        () => qc.invalidateQueries({ queryKey: ['post-likes'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'startup_likes' },
        () => qc.invalidateQueries({ queryKey: ['startup-likes'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' },
        () => {
          qc.invalidateQueries({ queryKey: ['post-comments'] });
          qc.invalidateQueries({ queryKey: ['startup-comments'] });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
}

export function useShowcasePosts() {
  return useQuery({
    queryKey: ['showcase-posts'],
    queryFn: async () => {
      // 1. Fetch posts
      const { data: posts, error } = await supabase
        .from('showcase_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      // 2. Batch-fetch profiles for all authors
      const userIds = [...new Set(posts.map((p: any) => p.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      // 3. Build a lookup map
      const profileMap = new Map(
        (profiles ?? []).map((p: any) => [p.user_id, p])
      );

      // 4. Merge profile name + avatar onto each post
      return posts.map((post: any) => {
        const profile = profileMap.get(post.user_id);
        return {
          ...post,
          author_name:   profile?.full_name  ?? null,
          author_avatar: profile?.avatar_url ?? null,
        };
      }) as (ShowcasePost & { author_name: string | null; author_avatar: string | null })[];
    },
  });
}

export function usePostLikes() {
  return useQuery({
    queryKey: ['post-likes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('post_likes').select('*');
      if (error) throw error;
      return (data ?? []) as PostLike[];
    },
  });
}

export function useStartupLikes() {
  return useQuery({
    queryKey: ['startup-likes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('startup_likes').select('*');
      if (error) throw error;
      return (data ?? []) as StartupLike[];
    },
  });
}

export function useComments() {
  return useQuery({
    queryKey: ['post-comments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PostComment[];
    },
  });
}

export function useCreatePost() {
  const invoke = useInvokeEdge();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { content: string; image_url?: string; startup_id?: string | null }) => {
      const res = await invoke('manage-social-feed', { action: 'create_post', ...input });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['showcase-posts'] }),
    onError: (e: Error) => toast({ title: 'Could not post', description: e.message, variant: 'destructive' }),
  });
}

export function useDeletePost() {
  const invoke = useInvokeEdge();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (post_id: string) => {
      const res = await invoke('manage-social-feed', { action: 'delete_post', post_id });
      if (res.error) throw res.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['showcase-posts'] }),
    onError: (e: Error) => toast({ title: 'Could not delete', description: e.message, variant: 'destructive' }),
  });
}

export function useTogglePostLike() {
  const invoke = useInvokeEdge();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post_id: string) => {
      const res = await invoke('manage-social-feed', { action: 'toggle_post_like', post_id });
      if (res.error) throw res.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post-likes'] }),
  });
}

export function useToggleStartupLike() {
  const invoke = useInvokeEdge();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (startup_id: string) => {
      const res = await invoke('manage-social-feed', { action: 'toggle_startup_like', startup_id });
      if (res.error) throw res.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['startup-likes'] }),
  });
}

export function useCreateComment() {
  const invoke = useInvokeEdge();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { content: string; post_id?: string; startup_id?: string }) => {
      const res = await invoke('manage-social-feed', { action: 'create_comment', ...input });
      if (res.error) throw res.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post-comments'] }),
    onError: (e: Error) => toast({ title: 'Could not comment', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteComment() {
  const invoke = useInvokeEdge();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (comment_id: string) => {
      const res = await invoke('manage-social-feed', { action: 'delete_comment', comment_id });
      if (res.error) throw res.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post-comments'] }),
  });
}