import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/types';

interface AuthContextType {
  user: { id: string; email: string; full_name: string; avatar_url?: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  profileCompleted: boolean;
  logout: () => void;
  refetchProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useClerkAuth();
  const { signOut } = useClerk();
  const [role, setRole] = useState<UserRole | null>(null);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;

    if (!isSignedIn || !clerkUser) {
      setRole(null);
      setProfileCompleted(false);
      setRoleLoading(false);
      return;
    }

    const fetchRoleAndProfile = async () => {
      setRoleLoading(true);

      const [roleRes, profileRes] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', clerkUser.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('profile_completed, full_name')
          .eq('user_id', clerkUser.id)
          .maybeSingle(),
      ]);

      setRole((roleRes.data?.role as UserRole) ?? null);
      setProfileCompleted(profileRes.data?.profile_completed ?? false);
      setRoleLoading(false);
    };

    fetchRoleAndProfile();
  }, [isSignedIn, clerkUser, authLoaded, userLoaded, fetchKey]);

  const isLoading = !authLoaded || !userLoaded || roleLoading;

  const user = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
        full_name: clerkUser.fullName || clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || '',
        avatar_url: clerkUser.imageUrl,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!isSignedIn,
        isLoading,
        role,
        profileCompleted,
        logout: () => signOut(),
        refetchProfile: () => setFetchKey(k => k + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
