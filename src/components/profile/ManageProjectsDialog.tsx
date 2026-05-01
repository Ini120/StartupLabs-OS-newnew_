import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserProjects } from '@/hooks/use-profile';
import { useInvokeEdge } from '@/lib/invoke-edge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

export function ManageProjectsDialog({
  open, onOpenChange, userId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
}) {
  const { data: projects = [] } = useUserProjects(userId);
  const invoke = useInvokeEdge();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', role: '', stage: 'mvp', cover_url: '', link_url: '',
    started_at: '', ended_at: '',
  });
  const [saving, setSaving] = useState(false);

  const reset = () => setForm({ title: '', description: '', role: '', stage: 'mvp', cover_url: '', link_url: '', started_at: '', ended_at: '' });

  const add = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const r = await invoke('manage-social', { action: 'add_project', ...form });
    setSaving(false);
    if (r.error) {
      toast({ title: 'Failed', description: r.error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['user-projects', userId] });
    queryClient.invalidateQueries({ queryKey: ['user-activity', userId] });
    reset();
    setShowForm(false);
    toast({ title: 'Project added' });
  };

  const remove = async (id: string) => {
    const r = await invoke('manage-social', { action: 'delete_project', project_id: id });
    if (r.error) {
      toast({ title: 'Failed', description: r.error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['user-projects', userId] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage projects</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-2 w-full">
              <Plus className="h-4 w-4" /> Add a project
            </Button>
          )}

          {showForm && (
            <Card className="border-primary/30">
              <CardContent className="p-4 space-y-3">
                <Input placeholder="Project title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Your role (e.g. Founder)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                  <Input placeholder="Stage (idea/mvp/growth)" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} />
                </div>
                <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Started</Label>
                    <Input type="date" value={form.started_at} onChange={(e) => setForm({ ...form, started_at: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Ended (optional)</Label>
                    <Input type="date" value={form.ended_at} onChange={(e) => setForm({ ...form, ended_at: e.target.value })} />
                  </div>
                </div>
                <Input placeholder="Cover image URL (optional)" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
                <Input placeholder="External link (optional)" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="ghost" onClick={() => { setShowForm(false); reset(); }}>Cancel</Button>
                  <Button onClick={add} disabled={saving}>{saving ? 'Adding…' : 'Add'}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No projects yet.</p>
            )}
            {projects.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.role || p.stage}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(p.id)} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
