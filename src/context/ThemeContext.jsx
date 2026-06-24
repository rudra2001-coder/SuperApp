import { createContext, useState, useEffect, useContext } from 'react';
import { supabase, isConfigured } from '../lib/supabase';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('superapp-theme') || 'light');
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('superapp-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!isConfigured() || synced) return;
    const syncTheme = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: existing } = await supabase
          .from('user_preferences')
          .select('id, data')
          .eq('user_id', session.user.id)
          .single();
        if (existing?.data?.theme) {
          setTheme(existing.data.theme);
        }
        setSynced(true);
      } catch {}
    };
    syncTheme();
  }, [synced]);

  useEffect(() => {
    if (!isConfigured() || !synced) return;
    const saveTheme = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: existing } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', session.user.id)
          .single();
        const record = {
          user_id: session.user.id,
          data: { theme },
          updated_at: new Date().toISOString(),
        };
        if (existing) {
          await supabase.from('user_preferences').update(record).eq('id', existing.id);
        } else {
          record.created_at = new Date().toISOString();
          await supabase.from('user_preferences').insert(record);
        }
      } catch {}
    };
    saveTheme();
  }, [theme, synced]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
