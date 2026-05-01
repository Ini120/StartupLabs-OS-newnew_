import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUserAchievements } from '@/hooks/use-profile';
import { useInvokeEdge } from '@/lib/invoke-edge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Trophy } from 'lucide-react';

export function ManageAchievementsDialog({
  open, onOpenChange, userId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
}) {
  const { data: achievements = [] } = useUserAchievements(userId);
  const invoke = useInvokeEdge();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', earned_at: '' });
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const r = await invoke('manage-social', { action: 'add_achievement', ...form });
    setSaving(false);
    if (r.error) {
      toast({ title: 'Failed', description: r.error.message, variant: 'destructive' });
      return;
    }
    setForm({ title: '', description: '', earned_at: '' });
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['user-achievements', userId] });
    queryClient.invalidateQueries({ queryKey: ['user-activity', userId] });
  };

  const remove = async (id: string) => {
    const r = await invoke('manage-social', { action: 'delete_achievement', achievement_id: id });
    if (r.error) return;
    queryClient.invalidateQueries({ queryKey: ['user-achievements', userId] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage achievements</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-2 w-full">
              <Plus className="h-4 w-4" /> Add achievement
            </Button>
          )}
          {showForm && (
            <div className="space-y-2 p-3 rounded-lg border border-primary/30 bg-accent/30">
              <Input placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              <div>
                <Label className="text-xs">Earned on</Label>
                <Input type="date" value={form.earned_at} onChange={(e) => setForm({ ...form, earned_at: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={add} disabled={saving}>{saving ? 'Adding…' : 'Add'}</Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {achievements.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No achievements yet.</p>
            )}
            {achievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <Trophy className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  {a.description && <p className="text-xs text-muted-foreground truncate">{a.description}</p>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(a.id)} className="text-destructive hover:bg-destructive/10">
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
