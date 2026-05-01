import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StageBadge } from '@/components/shared/Stagebadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAllStartups } from '@/hooks/use-startups';
import { useShowcaseData } from '@/hooks/use-showcase';
import { Search, TrendingUp, CalendarDays, ArrowUpDown, Rocket } from 'lucide-react';

type SortKey = 'name' | 'progress' | 'created';

// Stage colour map — teal for ideation, blue for growth, amber for launch, green for scaling
const stageStyles: Record<string, { bg: string; border: string; text: string }> = {
  ideation:  { bg: '#E1F5EE', border: '#5DCAA5', text: '#085041' },
  mvp:       { bg: '#E6F1FB', border: '#85B7EB', text: '#0C447C' },
  growth:    { bg: '#FAEEDA', border: '#EF9F27', text: '#633806' },
  launch:    { bg: '#EEEDFE', border: '#AFA9EC', text: '#3C3489' },
  scaling:   { bg: '#EAF3DE', border: '#97C459', text: '#27500A' },
};

function StagePill({ stage }: { stage: string }) {
  const s = stageStyles[stage?.toLowerCase()] ?? { bg: '#F1EFE8', border: '#B4B2A9', text: '#444441' };
  return (
    <span style={{ background: s.bg, color: s.text, border: `0.5px solid ${s.border}`, fontSize: 12, fontWeight: 500, padding: '2px 9px', borderRadius: 99, display: 'inline-block', textTransform: 'capitalize' }}>
      {stage}
    </span>
  );
}

export default function AllStartups() {
  const { data: startups = [], isLoading } = useAllStartups();
  const { founders, milestones } = useShowcaseData(startups);
  const [search, setSearch] = useState('');
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const getMilestones = (id: string) => {
    const sml = milestones.filter(m => m.startup_id === id);
    const done = sml.filter(m => m.status === 'completed').length;
    return { total: sml.length, done, pct: sml.length ? Math.round((done / sml.length) * 100) : 0 };
  };

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
  };

  const filtered = startups
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'progress') cmp = getMilestones(a.id).pct - getMilestones(b.id).pct;
      else if (sortBy === 'created') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  const SortBtn = ({ label, k, icon }: { label: string; k: SortKey; icon?: React.ReactNode }) => (
    <Button variant={sortBy === k ? 'default' : 'outline'} size="sm" onClick={() => toggleSort(k)} className="gap-1.5 h-8">
      {icon}{label}
      {sortBy === k && <ArrowUpDown className="h-3 w-3 opacity-60" />}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium" style={{ fontFamily: 'var(--font-heading)' }}>All Startups</h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor and manage all startups in the lab.</p>
        </div>
        {startups.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">
            <Rocket className="h-4 w-4" /><span>{startups.length} startups</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search startups…" className="pl-9" />
        </div>
        <div className="flex gap-2">
          <SortBtn label="Name" k="name" />
          <SortBtn label="Progress" k="progress" icon={<TrendingUp className="h-3.5 w-3.5" />} />
          <SortBtn label="Date" k="created" icon={<CalendarDays className="h-3.5 w-3.5" />} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {startups.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-2">
              <Rocket className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No startups created yet.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-2">
              <Search className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No startups match your search.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Founder</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(startup => {
                  const { done, total, pct } = getMilestones(startup.id);
                  const founder = founders[startup.student_id || ''] || 'Unknown';
                  return (
                    <TableRow key={startup.id} className="hover:bg-secondary/40 transition-colors">
                      <TableCell>
                        <p className="font-medium text-sm">{startup.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{startup.description || '—'}</p>
                      </TableCell>
                      <TableCell className="text-sm">{founder}</TableCell>
                      <TableCell><StagePill stage={startup.stage} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[110px]">
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium text-muted-foreground w-8 text-right">{pct}%</span>
                        </div>
                        {total > 0 && <p className="text-xs text-muted-foreground mt-0.5">{done}/{total} done</p>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(startup.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedStartup({ ...startup, _pct: pct, _done: done, _total: total, _founder: founder }); setDialogOpen(true); }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Startup Details</DialogTitle></DialogHeader>
          {selectedStartup && (
            <div className="space-y-4 pt-2">
              <div>
                <p className="font-semibold text-lg leading-tight">{selectedStartup.name}</p>
                {selectedStartup.description && <p className="text-sm text-muted-foreground mt-1">{selectedStartup.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Stage', value: <StagePill stage={selectedStartup.stage} /> },
                  { label: 'Founder', value: <span className="text-sm">{selectedStartup._founder}</span> },
                  { label: 'Created', value: <span className="text-sm">{new Date(selectedStartup.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> },
                  { label: 'Progress', value: <span className="text-sm font-semibold">{selectedStartup._pct}% <span className="font-normal text-muted-foreground">({selectedStartup._done}/{selectedStartup._total})</span></span> },
                ].map(item => (
                  <div key={item.label} className="rounded-lg bg-secondary/50 px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{item.label}</p>
                    {item.value}
                  </div>
                ))}
              </div>
              {selectedStartup._total > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Milestone progress</p>
                  <Progress value={selectedStartup._pct} className="h-2" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}