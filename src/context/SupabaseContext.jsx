import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isConfigured } from '../lib/supabase';

export const SupabaseContext = createContext();

export function SupabaseProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (!s) {
        supabase.auth.signInAnonymously().then(({ data, error: err }) => {
          if (err) setError(err.message);
          else setSession(data?.session);
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, session, loading, error, configured: isConfigured() }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider');
  return ctx;
}
