import { useState } from 'react';
import { discoverSubdomains } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import CopyButton from '../../components/common/CopyButton';

export default function SubdomainDiscovery() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('superapp-subdomain-history') || '[]'); } catch { return []; }
  });

  const discover = async () => {
    if (!domain.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await discoverSubdomains(domain.trim().toLowerCase());
      if (data.error) { setError(data.error); return; }
      setResult(data);
      const updated = [{ domain: domain.trim(), count: data.count, timestamp: new Date().toISOString() }, ...history].slice(0, 20);
      setHistory(updated);
      localStorage.setItem('superapp-subdomain-history', JSON.stringify(updated));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const exportCSV = () => {
    if (!result?.subdomains?.length) return;
    const csv = 'Subdomain,IPs,Source\n' + result.subdomains.map(s =>
      `"${s.subdomain}","${(s.ips || []).join('; ')}","${s.source}"`
    ).join('\n');
    navigator.clipboard.writeText(csv);
    alert('CSV copied to clipboard!');
  };

  const inputStyle = { width: '100%' };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🔍 Subdomain Discovery</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <input value={domain} onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && discover()}
              placeholder="example.com" style={inputStyle} />
          </div>
          <button className="btn-primary" onClick={discover} disabled={loading} style={{ height: 40 }}>
            {loading ? '⏳' : '🚀 Discover'}
          </button>
          {result?.subdomains?.length > 0 && (
            <button className="btn-secondary" onClick={exportCSV} style={{ height: 40 }}>📋 Export CSV</button>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
          Discovers subdomains via crt.sh certificate transparency logs and common DNS wordlist.
        </p>
      </div>

      {history.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📜 Recent Lookups</h3>
          <div style={{ maxHeight: 100, overflowY: 'auto' }}>
            {history.map((h, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                borderBottom: '1px solid var(--border-color)', fontSize: 13, cursor: 'pointer',
              }} onClick={() => { setDomain(h.domain); setHistory(history); }}>
                <span style={{ fontWeight: 600 }}>{h.domain}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{h.count} subdomains</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} />}
      {loading && <LoadingSpinner text="Discovering subdomains..." />}

      {result && !loading && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>
                Found {result.count} subdomains for {result.domain}
              </h3>
            </div>
          </div>

          {result.subdomains?.length > 0 ? (
            <div className="card">
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{
                  display: 'flex', padding: '10px 14px', fontWeight: 600, fontSize: 13,
                  background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
                }}>
                  <span style={{ flex: 2 }}>Subdomain</span>
                  <span style={{ flex: 1 }}>IP Addresses</span>
                  <span style={{ flex: 0.5, textAlign: 'right' }}>Source</span>
                </div>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {result.subdomains.map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', padding: '8px 14px', fontSize: 13,
                      borderBottom: '1px solid var(--border-color)',
                      background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                    }}>
                      <span style={{ flex: 2, fontWeight: 600, wordBreak: 'break-all' }}>{s.subdomain}</span>
                      <span style={{ flex: 1, color: 'var(--text-secondary)' }}>
                        {(s.ips || []).join(', ') || '—'}
                      </span>
                      <span style={{ flex: 0.5, textAlign: 'right' }}>
                        <span className={`badge ${s.source === 'crt.sh' ? 'badge-success' : 'badge-warning'}`}>
                          {s.source}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <CopyButton text={result.subdomains.map(s => s.subdomain).join('\n')} label="Copy List" />
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              No subdomains found for {result.domain}
            </div>
          )}
        </>
      )}
    </div>
  );
}
