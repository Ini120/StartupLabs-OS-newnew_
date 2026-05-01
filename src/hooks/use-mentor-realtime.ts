import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to realtime changes that affect a mentor's view of mentees:
 *  - mentor_assignments  (new mentee approved / status change)
 *  - Startups            (mentee creates / updates a startup)
 *  - Milestones          (mentee progress on milestones)
 *
 * Any change invalidates the matching React Query keys, so the mentor
 * dashboard and "Assigned Startups" page refresh automatically.
 */
export function useMentorRealtime(mentorId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!mentorId) return;

    const channel = supabase
      .channel(`mentor-live-${mentorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mentor_assignments', filter: `mentor_id=eq.${mentorId}` },
        () => {
          qc.invalidateQueries({ queryKey: ['mentor-assignments'] });
          qc.invalidateQueries({ queryKey: ['mentor-student-profiles'] });
          qc.invalidateQueries({ queryKey: ['mentor-student-startups'] });
          qc.invalidateQueries({ queryKey: ['mentor-student-milestones'] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Startups' },
        () => {
          qc.invalidateQueries({ queryKey: ['mentor-student-startups'] });
          qc.invalidateQueries({ queryKey: ['mentor-student-milestones'] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Milestones' },
        () => {
          qc.invalidateQueries({ queryKey: ['mentor-student-milestones'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mentorId, qc]);
}
