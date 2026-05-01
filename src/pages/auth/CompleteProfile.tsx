import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useInvokeEdge } from '@/lib/invoke-edge';
import { Loader2, User, BookOpen, Building2 } from 'lucide-react';

const levels = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'PhD'];
const departments = [
  'Computer Science', 'Business Administration', 'Engineering',
  'Design', 'Marketing', 'Finance', 'Other',
];

export default function CompleteProfile() {
  const { user: clerkUser } = useUser();
  const { role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const invoke = useInvokeEdge();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: clerkUser?.fullName || '',
    bio: '',
    level: '',
    department: '',
  });

  const isStudent = role === 'student';
  const isMentor = role === 'mentor';

  const canSubmit = form.full_name.trim() && form.bio.trim() &&
    (isStudent ? form.level && form.department : true) &&
    (isMentor ? form.department : true);

  const handleSubmit = async () => {
    if (!clerkUser || !canSubmit) return;
    setLoading(true);
    try {
      const res = await invoke('manage-profile', {
        full_name: form.full_name.trim(),
        bio: form.bio.trim(),
        level: isStudent ? form.level : null,
        department: (isStudent || isMentor) ? form.department : null,
        profile_completed: true,
      });
      if (res.error) throw res.error;

      toast({ title: 'Profile completed!', description: 'Welcome to Startup OS.' });
      // Force a page reload to re-fetch profile state
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-lg overflow-hidden border-border/60 bg-card/80 shadow-glow-lg backdrop-blur-md">
        <div className="h-1 w-full bg-gradient-aurora" />
        <CardHeader className="pb-2 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-aurora shadow-glow">
            <User className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl text-gradient-primary" style={{ fontFamily: 'var(--font-heading)' }}>
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            {isStudent
              ? 'Tell us about yourself so we can match you with the right mentor.'
              : isMentor
                ? 'Share your expertise so students can benefit from your mentorship.'
                : 'Set up your admin profile.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Full Name
            </Label>
            <Input
              id="name"
              placeholder="Your full name"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder={isStudent
                ? 'Tell us about your interests, skills, and what you want to build...'
                : isMentor
                  ? 'Describe your expertise, industry experience, and how you can help students...'
                  : 'Brief description of your role...'}
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
            />
          </div>

          {(isStudent || isMentor) && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Department
              </Label>
              <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isStudent && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Level
              </Label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full mt-2 bg-gradient-aurora text-primary-foreground shadow-glow hover:opacity-90"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Continue to Dashboard'
            )}
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
