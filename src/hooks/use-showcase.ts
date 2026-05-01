import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StartupRow } from '@/hooks/use-startups';
import { MilestoneRow } from '@/hooks/use-milestones';

/**
 * Fetches founder names and milestones for all startups shown in the showcase.
 */
export function useShowcaseData(startups: StartupRow[]) {
  const startupIds = startups.map(s => s.id);
  const studentIds = [...new Set(startups.map(s => s.student_id).filter(Boolean))] as string[];

  const { data: founders = {}, isLoading: foundersLoading } = useQuery({
    queryKey: ['showcase-founders', studentIds],
    enabled: studentIds.length > 0,
    queryFn: async () => {
      // Use the profiles table so the founder name reflects the user's current full_name.
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', studentIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((u) => {
        if (u.full_name?.trim()) map[u.user_id] = u.full_name;
      });
      return map;
    },
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['showcase-milestones', startupIds],
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

  return {
    founders,
    milestones,
    isLoading: foundersLoading || milestonesLoading,
  };
}
