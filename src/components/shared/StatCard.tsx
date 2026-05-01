import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  accent?: 'primary' | 'success' | 'warning' | 'destructive';
}

const accentMap: Record<NonNullable<StatCardProps['accent']>, string> = {
  primary: 'from-primary/15 to-primary-glow/15 text-primary',
  success: 'from-success/15 to-success/5 text-success',
  warning: 'from-warning/20 to-warning/5 text-warning',
  destructive: 'from-destructive/15 to-destructive/5 text-destructive',
};

export function StatCard({ title, value, icon: Icon, description, accent = 'primary' }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm hover-lift">
      <div className="pointer-events-none absolute inset-0 bg-gradient-subtle opacity-60" />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p
              className="mt-2 text-3xl font-bold tabular-nums tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {value}
            </p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ring-1 ring-border/40',
              accentMap[accent],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
