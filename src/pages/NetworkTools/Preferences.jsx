import { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function Preferences() {
  const { supabase, session, configured } = useSupabase();
  const [prefs, setPrefs] = useLocalStorage('superapp-preferences', {
    defaultPingCount: 4,
    defaultPortScanRange: 'common',
    autoSaveHistory: true,
    darkMode: false,
    pollInterval: 30,
    sslExpiryWarningDays: 30,
  });
  const [saved, setSaved] = useState(false);
  const userId = session?.user?.id;

  useEffect(() => {
    if (!configured || !userId) return;
    supabase.from('user_preferences').select('data').eq('user_id', userId).single().then(({ data }) => {
      if (data?.data) setPrefs({ ...prefs, ...data.data });
    }).catch(() => {});
  }, [configured, userId]);

  const savePrefs = async () => {
    setPrefs(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    if (!configured || !userId) return;
    try {
      const { data: existing } = await supabase.from('user_preferences').select('id').eq('user_id', userId).single();
      const record = { user_id: userId, data: prefs, updated_at: new Date().toISOString() };
      if (existing) {
        await supabase.from('user_preferences').update(record).eq('id', existing.id);
      } else {
        record.created_at = new Date().toISOString();
        await supabase.from('user_preferences').insert(record);
      }
    } catch {}
  };

  const FieldRow = ({ label, children }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid var(--border-color)',
    }}>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>⚙️ User Preferences</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ borderRadius: 8, overflow: 'hidden' }}>
          <FieldRow label="Default Ping Count">
            <input type="number" min={1} max={20} value={prefs.defaultPingCount}
              onChange={e => setPrefs({ ...prefs, defaultPingCount: Number(e.target.value) })}
              style={{ width: 80, textAlign: 'center' }} />
          </FieldRow>

          <FieldRow label="Default Port Scan Range">
            <select value={prefs.defaultPortScanRange}
              onChange={e => setPrefs({ ...prefs, defaultPortScanRange: e.target.value })}
              style={{ width: 160 }}>
              <option value="common">Common (21-23,25,53,80,...)</option>
              <option value="full">Full (1-65535)</option>
              <option value="custom">Custom</option>
            </select>
          </FieldRow>

          <FieldRow label="Auto-Save History">
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
              <input type="checkbox" checked={prefs.autoSaveHistory}
                onChange={e => setPrefs({ ...prefs, autoSaveHistory: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{
                position: 'absolute', inset: 0, borderRadius: 12,
                background: prefs.autoSaveHistory ? 'var(--success)' : 'var(--border-color)',
                transition: '0.3s',
              }}>
                <span style={{
                  position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#fff', top: 3,
                  transition: '0.3s', left: prefs.autoSaveHistory ? 23 : 3,
                }} />
              </span>
            </label>
          </FieldRow>

          <FieldRow label="Dashboard Poll Interval (seconds)">
            <input type="number" min={10} max={300} value={prefs.pollInterval}
              onChange={e => setPrefs({ ...prefs, pollInterval: Number(e.target.value) })}
              style={{ width: 80, textAlign: 'center' }} />
          </FieldRow>

          <FieldRow label="SSL Expiry Warning (days)">
            <input type="number" min={1} max={90} value={prefs.sslExpiryWarningDays}
              onChange={e => setPrefs({ ...prefs, sslExpiryWarningDays: Number(e.target.value) })}
              style={{ width: 80, textAlign: 'center' }} />
          </FieldRow>
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-primary" onClick={savePrefs}>
            {saved ? '✅ Saved!' : '💾 Save Preferences'}
          </button>
          {saved && <span style={{ fontSize: 13, color: 'var(--success)' }}>Preferences saved to {configured ? 'Supabase' : 'localStorage'}</span>}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📊 Storage Info</h3>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <p>Supabase: {configured ? '✅ Connected' : '❌ Not configured (using localStorage)'}</p>
          <p>Session: {session ? `Active (${session.user.id.slice(0, 8)}...)` : 'Anonymous'}</p>
          <p>History is synced across sessions via Supabase when available.</p>
        </div>
      </div>
    </div>
  );
}
