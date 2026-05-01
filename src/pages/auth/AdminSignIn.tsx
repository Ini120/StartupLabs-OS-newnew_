import { SignIn } from '@clerk/clerk-react';
import { AuthLayout } from '@/components/layout/AuthLayout';

export default function AdminSignIn() {
  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Admin sign in
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your admin account to manage the workspace.
          </p>
        </div>
        <div className="flex justify-center">
          <SignIn
            routing="hash"
            signUpUrl="/admin-sign-up"
            afterSignInUrl="/dashboard"
            forceRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </AuthLayout>
  );
}