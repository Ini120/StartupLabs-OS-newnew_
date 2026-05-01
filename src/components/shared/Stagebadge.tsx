import { Badge } from '@/components/ui/badge';
import { StartupStage } from '@/types';
import { cn } from '@/lib/utils';

const stageConfig: Record<StartupStage, { label: string; className: string }> = {
  idea: {
    label: 'Idea',
    className: 'bg-muted/80 text-muted-foreground border-border/60',
  },
  validation: {
    label: 'Validation',
    className: 'bg-warning/15 text-warning border-warning/40',
  },
  mvp: {
    label: 'MVP',
    className: 'bg-primary/15 text-primary border-primary/40',
  },
  growth: {
    label: 'Growth',
    className: 'bg-success/15 text-success border-success/40',
  },
};

export function StageBadge({ stage }: { stage: StartupStage }) {
  const config = stageConfig[stage];
  return (
    <Badge
      variant="outline"
      className={cn('rounded-full font-semibold text-[10px] uppercase tracking-wider px-2.5 py-0.5', config.className)}
    >
      {config.label}
    </Badge>
  );
}
