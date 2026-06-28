import { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { pingTarget, checkHTTPHeaders, checkSSLCert } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const CHECK_TYPES = [
  { value: 'http', label: 'HTTP', icon: '🌐' },
  { value: 'ping', label: 'Ping', icon: '📶' },
  { value: 'ssl', label: 'SSL', icon: '🔒' },
];

function simulateCheck(target, type) {
  const latency = 10 + Math.random() * 190;
  const up = Math.random() > 0.15;
  return {
    target,
    type,
    status: up ? 'up' : 'down',
    latency_ms: up ? latency : null,
    checked_at: new Date().toISOString(),
    simulated: true,
  };
}

async function runRealCheck(target, type) {
  try {
    if (type === 'http') {
      const data = await checkHTTPHeaders(target);
      return { target, type, status: data.statusCode < 500 ? 'up' : 'down', latency_ms: data.timing?.total || null, checked_at: new Date().toISOString(), simulated: false };
    }
    if (type === 'ping') {
      const data = await pingTarget(target, 2);
      const up = data.status === 'reachable' || data.received > 0;
      return { target, type, status: up ? 'up' : 'down', latency_ms: data.avg || null, checked_at: new Date().toISOString(), simulated: false };
    }
    if (type === 'ssl') {
      const data = await checkSSLCert(target);
      return { target, type, status: data.expired ? 'down' : 'up', latency_ms: null, checked_at: new Date().toISOString(), simulated: false };
    }
  } catch {
    return { target, type, status: 'down', latency_ms: null, checked_at: new Date().toISOString(), simulated: false };
  }
}

export default function NetworkDashboard() {
  const { supabase, session, configured } = useSupabase();
  const [targets, setTargets] = useLocalStorage('superapp-dashboard-targets', []);
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newType, setNewType] = useState('http');
  const [isSimulated, setIsSimulated] = useState(true);
  const intervalRef = useRef(null);
  const userId = session?.user?.id;

  const addTarget = () => {
    if (!newTarget.trim()) return;
    const t = { id: Date.now().toString(), target: newTarget.trim(), type: newType, addedAt: new Date().toISOString() };
    setTargets([...targets, t]);
    setNewTarget('');
  };

  const removeTarget = (id) => {
    setTargets(targets.filter(t => t.id !== id));
  };

  const runAllChecks = useCallback(async () => {
    if (targets.length === 0) return;
    const results = [];
    for (const t of targets) {
      const result = isSimulated ? simulateCheck(t.target, t.type) : await runRealCheck(t.target, t.type);
      results.push(result);
    }
    setChecks(results);

    if (configured && userId) {
      try {
        const rows = results.map(r => ({
          target: r.target,
          type: r.type,
          status: r.status,
          latency_ms: r.latency_ms,
          checked_at: r.checked_at,
          session_id: userId,
        }));
        await supabase.from('network_checks').insert(rows);
      } catch {}
    }
  }, [targets, isSimulated, configured, userId, supabase]);

  useEffect(() => {
    if (!configured || !userId) return;
    const subscription = supabase
      .channel('network_checks_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'network_checks', filter: `session_id=eq.${userId}` }, (payload) => {
        setChecks(prev => {
          const existing = prev.findIndex(c => c.target === payload.new.target && c.type === payload.new.type);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = payload.new;
            return updated;
          }
          return [payload.new, ...prev];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [configured, userId, supabase]);

  const startPolling = () => {
    if (intervalRef.current) return;
    runAllChecks();
    intervalRef.current = setInterval(runAllChecks, 30000);
  };

  const stopPolling = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const getStatusBadge = (status) => {
    if (status === 'up') return <span className="badge badge-success">✅ Up</span>;
    if (status === 'down') return <span className="badge badge-danger">❌ Down</span>;
    return <span className="badge badge-warning">⏳ Pending</span>;
  };

  const getTypeIcon = (type) => {
    const t = CHECK_TYPES.find(c => c.value === type);
    return t ? t.icon : '🔍';
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>📊 Network Status Dashboard</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Monitor multiple targets in real time. Checks run every 30s via {isSimulated ? 'simulation' : 'live backend'}.
        {isSimulated && <span style={{ color: 'var(--warning)', marginLeft: 8 }}>⚠️ Simulated mode</span>}
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input value={newTarget} onChange={e => setNewTarget(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTarget()}
              placeholder="example.com or https://..." style={{ width: '100%' }} />
          </div>
          <select value={newType} onChange={e => setNewType(e.target.value)} style={{ width: 100 }}>
            {CHECK_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>
          <button className="btn-primary" onClick={addTarget} style={{ height: 40, whiteSpace: 'nowrap' }}>+ Add Target</button>
          <button className="btn-secondary" onClick={() => setIsSimulated(!isSimulated)} style={{ height: 40 }}>
            {isSimulated ? '🔴 Simulated' : '🟢 Live'}
          </button>
        </div>

        {targets.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={startPolling} style={{ height: 36 }}>
              ▶ Start Monitoring
            </button>
            <button className="btn-secondary" onClick={stopPolling} style={{ height: 36 }}>
              ⏹ Stop
            </button>
            <button className="btn-secondary" onClick={runAllChecks} disabled={loading} style={{ height: 36 }}>
              {loading ? '⏳' : '🔄 Check Now'}
            </button>
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} onRetry={runAllChecks} />}

      {targets.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>
          Add targets above to start monitoring
        </div>
      )}

      {targets.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Monitored Targets ({targets.length})</h3>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {intervalRef.current ? '🟢 Active' : '⏸ Paused'}
            </span>
          </div>

          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div style={{
              display: 'flex', padding: '10px 14px', fontWeight: 600, fontSize: 13,
              background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
            }}>
              <span style={{ flex: 0.5 }}>Type</span>
              <span style={{ flex: 2 }}>Target</span>
              <span style={{ flex: 1 }}>Status</span>
              <span style={{ flex: 1 }}>Latency</span>
              <span style={{ flex: 1.5 }}>Last Check</span>
              <span style={{ flex: 0.5 }} />
            </div>
            {targets.map(t => {
              const check = checks.find(c => c.target === t.target && c.type === t.type);
              return (
                <div key={t.id} style={{
                  display: 'flex', padding: '10px 14px', fontSize: 13, alignItems: 'center',
                  borderBottom: '1px solid var(--border-color)', background: check?.status === 'down' ? 'rgba(239,71,111,0.05)' : 'transparent',
                }}>
                  <span style={{ flex: 0.5, fontSize: 18 }}>{getTypeIcon(t.type)}</span>
                  <span style={{ flex: 2, fontWeight: 600, wordBreak: 'break-all' }}>{t.target}</span>
                  <span style={{ flex: 1 }}>{check ? getStatusBadge(check.status) : <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>—</span>}</span>
                  <span style={{ flex: 1, color: 'var(--text-secondary)' }}>
                    {check?.latency_ms ? `${Number(check.latency_ms).toFixed(1)} ms` : '—'}
                  </span>
                  <span style={{ flex: 1.5, color: 'var(--text-secondary)', fontSize: 12 }}>
                    {check?.checked_at ? new Date(check.checked_at).toLocaleTimeString() : '—'}
                  </span>
                  <span style={{ flex: 0.5 }}>
                    {check?.simulated && <span style={{ fontSize: 11, color: 'var(--warning)' }}>SIM</span>}
                  </span>
                  <button className="btn-sm" onClick={() => removeTarget(t.id)}
                    style={{ color: 'var(--danger)', background: 'transparent', padding: '4px 8px' }}>✕</button>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>✅ Up: {checks.filter(c => c.status === 'up').length}</span>
            <span>❌ Down: {checks.filter(c => c.status === 'down').length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
