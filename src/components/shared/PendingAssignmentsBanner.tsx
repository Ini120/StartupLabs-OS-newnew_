import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

/**
 * Admin dashboard banner: highlights pending mentor-assignment approvals
 * with a quick link to the review page. Hidden when nothing is pending.
 */
export function PendingAssignmentsBanner() {
  const { data: count = 0 } = useQuery({
    queryKey: ['admin-banner', 'pending-assignments'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('mentor_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (count === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-aurora p-[1px] shadow-glow animate-fade-in">
      <div className="relative flex flex-col gap-4 rounded-[15px] bg-card/95 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-aurora shadow-glow">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              {count} mentor assignment{count === 1 ? '' : 's'} awaiting your approval
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              New students were auto-matched with mentors. Review and approve, reject, or reassign.
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0 bg-gradient-aurora text-primary-foreground shadow-md hover:opacity-90">
          <Link to="/mentor-assignments">
            Review now
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
