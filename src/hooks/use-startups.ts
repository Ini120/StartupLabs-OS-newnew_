import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useInvokeEdge } from '@/lib/invoke-edge';

export interface StartupRow {
  id: string;
  name: string | null;
  description: string | null;
  stage: string;
  status: string | null;
  student_id: string | null;
  created_at: string;
}

export function useMyStartups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['startups', 'mine', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Startups')
        .select('*')
        .eq('student_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as StartupRow[];
    },
  });
}

export function useAllStartups() {
  return useQuery({
    queryKey: ['startups', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Startups')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as StartupRow[];
    },
  });
}

export function useCreateStartup() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const invoke = useInvokeEdge();

  return useMutation({
    mutationFn: async (input: { name: string; description: string; stage: string }) => {
      const res = await invoke('manage-startup', { action: 'create', ...input });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['startups'] });
      toast({ title: 'Startup created!' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateStartup() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const invoke = useInvokeEdge();

  return useMutation({
    mutationFn: async (input: { startup_id: string; name?: string; description?: string; stage?: string }) => {
      const res = await invoke('manage-startup', { action: 'update', ...input });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['startups'] });
      toast({ title: 'Startup updated!' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

export function useDeleteStartup() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const invoke = useInvokeEdge();

  return useMutation({
    mutationFn: async (startup_id: string) => {
      const res = await invoke('manage-startup', { action: 'delete', startup_id });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['startups'] });
      toast({ title: 'Startup deleted.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}
