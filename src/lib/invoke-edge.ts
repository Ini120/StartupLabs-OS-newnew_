import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook returning a function that invokes a Supabase edge function with a
 * verified Clerk JWT in the Authorization header. The edge functions verify
 * this token server-side and derive the user id from it — never trust
 * `user_id` sent in the body.
 */
export function useInvokeEdge() {
  const { getToken } = useClerkAuth();

  return async <T = unknown>(
    name: string,
    body: Record<string, unknown> = {},
  ): Promise<{ data: T | null; error: Error | null }> => {
    const token = await getToken();
    if (!token) {
      return { data: null, error: new Error('Not signed in') };
    }
    const res = await supabase.functions.invoke(name, {
      body,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.error) return { data: null, error: new Error(res.error.message) };
    const data = res.data as { error?: string } | null;
    if (data && typeof data === 'object' && 'error' in data && data.error) {
      return { data: null, error: new Error(data.error as string) };
    }
    return { data: res.data as T, error: null };
  };
}
