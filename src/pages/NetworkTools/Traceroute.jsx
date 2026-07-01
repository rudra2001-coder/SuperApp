import { useState } from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { traceroute } from '../../utils/api';

export default function Traceroute() {
  const [target, setTarget] = useState('');
  const [hops, setHops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trace = async () => {
    if (!target.trim()) return;
    setLoading(true); setError(''); setHops([]);
    try {
      const data = await traceroute(target.trim());
      setHops(data.hops || []);
    } catch {
      setError('Traceroute request failed');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🗺️ Traceroute</h2>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input value={target} onChange={e => setTarget(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && trace()}
              placeholder="Hostname or IP" style={{ width: '100%' }} />
          </div>
          <button className="btn-primary" onClick={trace} disabled={loading} style={{ height: 40 }}>
            {loading ? 'Tracing...' : '🚀 Trace'}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {loading && <LoadingSpinner text="Tracing route..." />}

      {hops.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Trace route to {target}
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Hop</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Host</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>IP</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>RTT 1</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>RTT 2</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>RTT 3</th>
              </tr>
            </thead>
            <tbody>
              {hops.map((h, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{h.hop}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>{h.hostname}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 13 }}>{h.ip}</td>
                  <td style={{ padding: '8px 12px' }}>{h.rtt1} ms</td>
                  <td style={{ padding: '8px 12px' }}>{h.rtt2} ms</td>
                  <td style={{ padding: '8px 12px' }}>{h.rtt3} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
