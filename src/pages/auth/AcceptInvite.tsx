import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useInvokeEdge } from '@/lib/invoke-edge';
import { supabase } from '@/integrations/supabase/client';

type Validation = { state: 'loading' } | { state: 'invalid'; reason: string } | { state: 'valid'; email: string; role: string };

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const invoke = useInvokeEdge();
  const [validation, setValidation] = useState<Validation>({ state: 'loading' });
  const [redeeming, setRedeeming] = useState(false);
  const [mode, setMode] = useState<'sign-up' | 'sign-in'>('sign-up');

  useEffect(() => {
    if (!token) {
      setValidation({ state: 'invalid', reason: 'No token provided' });
      return;
    }
    (async () => {
      const { data } = await supabase.functions.invoke('manage-admin-invites', {
        body: { action: 'validate_invite', token },
      });
      const d = data as any;
      if (d?.valid) setValidation({ state: 'valid', email: d.invite.email, role: d.invite.role });
      else setValidation({ state: 'invalid', reason: d?.reason || 'unknown' });
    })();
  }, [token]);

  // Once authenticated and invite is valid, redeem
  useEffect(() => {
    if (validation.state !== 'valid' || !isAuthenticated || redeeming) return;
    (async () => {
      setRedeeming(true);
      const res = await invoke('manage-admin-invites', { action: 'redeem_invite', token });
      if (res.error) {
        toast({ title: 'Could not accept invite', description: res.error.message, variant: 'destructive' });
        setRedeeming(false);
        return;
      }
      toast({ title: 'Welcome!', description: `You are now ${(res.data as any).role}` });
      navigate('/dashboard');
    })();
  }, [validation, isAuthenticated, redeeming, invoke, navigate, toast, token]);

  if (validation.state === 'loading') {
    return (
      <AuthLayout>
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Validating invite…
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (validation.state === 'invalid') {
    const msg = validation.reason === 'used' ? 'This invite has already been used.'
      : validation.reason === 'expired' ? 'This invite has expired.'
      : 'This invite link is invalid.';
    return (
      <AuthLayout>
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/15 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Invite invalid</h2>
            <p className="text-sm text-muted-foreground">{msg}</p>
            <Button variant="outline" onClick={() => navigate('/sign-in')}>Go to sign in</Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  // Valid invite
  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-5">
        <Card>
          <CardContent className="p-5 flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-success/15 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">You've been invited as <span className="text-primary">{validation.role.replace('_', ' ')}</span></p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> Invite for {validation.email}
              </p>
            </div>
          </CardContent>
        </Card>

        <SignedIn>
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Activating your account…
            </CardContent>
          </Card>
        </SignedIn>

        <SignedOut>
          <div className="flex justify-center">
            {mode === 'sign-up'
              ? <SignUp routing="hash" />
              : <SignIn routing="hash" />}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {mode === 'sign-up' ? 'Already have an account?' : 'No account yet?'}{' '}
            <button
              className="text-primary hover:underline"
              onClick={() => setMode(m => (m === 'sign-up' ? 'sign-in' : 'sign-up'))}
            >
              {mode === 'sign-up' ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </SignedOut>
      </div>
    </AuthLayout>
  );
}
