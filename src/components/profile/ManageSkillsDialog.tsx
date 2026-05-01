import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserSkills } from '@/hooks/use-profile';
import { useInvokeEdge } from '@/lib/invoke-edge';
import { useToast } from '@/hooks/use-toast';
import { X, Plus } from 'lucide-react';

export function ManageSkillsDialog({
  open, onOpenChange, userId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
}) {
  const { data: skills = [] } = useUserSkills(userId);
  const invoke = useInvokeEdge();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setAdding(true);
    const r = await invoke('manage-social', { action: 'add_skill', name: name.trim() });
    setAdding(false);
    if (r.error) {
      toast({ title: 'Failed', description: r.error.message, variant: 'destructive' });
      return;
    }
    setName('');
    queryClient.invalidateQueries({ queryKey: ['user-skills', userId] });
  };

  const remove = async (id: string) => {
    const r = await invoke('manage-social', { action: 'delete_skill', skill_id: id });
    if (r.error) return;
    queryClient.invalidateQueries({ queryKey: ['user-skills', userId] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage skills</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. React, Product, UX research"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            />
            <Button onClick={add} disabled={adding} size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[60px] p-3 rounded-lg bg-muted/40">
            {skills.length === 0 && (
              <p className="text-xs text-muted-foreground self-center mx-auto">No skills yet.</p>
            )}
            {skills.map((s) => (
              <Badge key={s.id} variant="outline" className="bg-accent text-accent-foreground border-accent gap-1 pl-2.5 pr-1 py-1">
                {s.name}
                <button onClick={() => remove(s.id)} className="hover:bg-destructive/20 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
