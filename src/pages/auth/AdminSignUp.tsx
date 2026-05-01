import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react';
import { Crown, Loader2, ShieldAlert } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useInvokeEdge } from '@/lib/invoke-edge';
import { supabase } from '@/integrations/supabase/client';

export default function AdminSignUp() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const invoke = useInvokeEdge();

  const [checking, setChecking] = useState(true);
  const [superAdminExists, setSuperAdminExists] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);

  // Check on mount whether a super admin already exists
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke('manage-admin-invites', {
        body: { action: 'super_admin_exists' },
      });
      if (!error && data) setSuperAdminExists(!!(data as any).exists);
      setChecking(false);
    })();
  }, []);

  // Once user is signed in AND no super admin exists, claim the role
  useEffect(() => {
    if (!isLoaded || !user || superAdminExists || checking || bootstrapping) return;
    (async () => {
      setBootstrapping(true);
      const res = await invoke('manage-admin-invites', { action: 'bootstrap_super_admin' });
      if (res.error) {
        toast({ title: 'Could not become super admin', description: res.error.message, variant: 'destructive' });
        setBootstrapping(false);
        return;
      }
      toast({ title: 'You are now Super Admin', description: 'Welcome aboard!' });
      navigate('/dashboard');
    })();
  }, [isLoaded, user, superAdminExists, checking, bootstrapping, invoke, navigate, toast]);

  if (checking) {
    return (
      <AuthLayout>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking…
        </div>
      </AuthLayout>
    );
  }

  if (superAdminExists) {
    return (
      <AuthLayout>
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-warning/15 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-warning" />
            </div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Admin signup is closed
            </h2>
            <p className="text-sm text-muted-foreground">
              A Super Admin already exists for this workspace. Ask them to send you an
              invite link, or sign in with your existing account.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate('/sign-in')}>Sign in</Button>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-gradient-aurora flex items-center justify-center shadow-glow">
            <Crown className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Claim Super Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            You're the first one here. Sign up to become the Super Admin and invite the rest of your team.
          </p>
        </div>

        <SignedOut>
          <div className="flex justify-center">
            <SignUp routing="hash" signInUrl="/admin-sign-in" />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <button onClick={() => navigate('/admin-sign-in')} className="text-primary hover:underline">
              Sign in instead
            </button>
          </p>
        </SignedOut>

        <SignedIn>
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Granting Super Admin role…
            </CardContent>
          </Card>
        </SignedIn>
      </div>
    </AuthLayout>
  );
}
