import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useInvokeEdge } from '@/lib/invoke-edge';
import { useToast } from '@/hooks/use-toast';
import type { ProfileData } from '@/hooks/use-profile';

export function EditProfileDialog({
  open, onOpenChange, profile,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: ProfileData;
}) {
  const invoke = useInvokeEdge();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: profile.full_name,
    headline: profile.headline,
    bio: profile.bio,
    location: profile.location,
    department: profile.department,
    level: profile.level,
    avatar_url: profile.avatar_url,
    github_url: profile.github_url,
    linkedin_url: profile.linkedin_url,
    twitter_url: profile.twitter_url,
    website_url: profile.website_url,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const r = await invoke('manage-social', { action: 'update_profile', ...form });
    setSaving(false);
    if (r.error) {
      toast({ title: 'Failed to save', description: r.error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['profile', profile.user_id] });
    toast({ title: 'Profile updated' });
    onOpenChange(false);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name">
              <Input value={form.full_name} onChange={set('full_name')} />
            </Field>
            <Field label="Avatar URL">
              <Input value={form.avatar_url} onChange={set('avatar_url')} placeholder="https://…" />
            </Field>
          </div>
          <Field label="Headline">
            <Input value={form.headline} onChange={set('headline')} placeholder="What you do in one line" />
          </Field>
          <Field label="Bio">
            <Textarea value={form.bio} onChange={set('bio')} rows={4} placeholder="Tell us about yourself" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <Input value={form.location} onChange={set('location')} placeholder="City, Country" />
            </Field>
            <Field label="Department">
              <Input value={form.department} onChange={set('department')} />
            </Field>
            <Field label="Level / Year">
              <Input value={form.level} onChange={set('level')} />
            </Field>
          </div>
          <div className="space-y-3 pt-2 border-t">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Social links</p>
            <Field label="GitHub">
              <Input value={form.github_url} onChange={set('github_url')} placeholder="https://github.com/…" />
            </Field>
            <Field label="LinkedIn">
              <Input value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/…" />
            </Field>
            <Field label="Twitter / X">
              <Input value={form.twitter_url} onChange={set('twitter_url')} placeholder="https://x.com/…" />
            </Field>
            <Field label="Website">
              <Input value={form.website_url} onChange={set('website_url')} placeholder="https://…" />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
