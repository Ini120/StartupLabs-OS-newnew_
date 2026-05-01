import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useInvokeEdge } from '@/lib/invoke-edge';

export interface MilestoneRow {
  id: number;
  startup_id: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  due_date: string | null;
  created_at: string;
}

export function useMilestonesByStartups(startupIds: string[]) {
  return useQuery({
    queryKey: ['milestones', startupIds],
    enabled: startupIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Milestones')
        .select('*')
        .in('startup_id', startupIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as MilestoneRow[];
    },
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const invoke = useInvokeEdge();

  return useMutation({
    mutationFn: async (input: { startup_id: string; title: string; description?: string; due_date?: string }) => {
      const res = await invoke('manage-milestone', { action: 'create', ...input });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones'] });
      toast({ title: 'Milestone created!' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const invoke = useInvokeEdge();

  return useMutation({
    mutationFn: async (input: { startup_id: string; milestone_id: number; title?: string; description?: string; status?: string; due_date?: string }) => {
      const res = await invoke('manage-milestone', { action: 'update', ...input });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones'] });
      toast({ title: 'Milestone updated!' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}
