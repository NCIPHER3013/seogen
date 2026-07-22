import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        // Force session refresh to get the latest user_metadata from server
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (session?.user) {
          setIsAdmin(session.user.user_metadata?.role === 'admin');
        } else {
          // Fallback to getUser if refresh fails
          const { data: { user } } = await supabase.auth.getUser();
          setIsAdmin(user?.user_metadata?.role === 'admin');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setIsAdmin(session.user.user_metadata?.role === 'admin');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, loading };
}