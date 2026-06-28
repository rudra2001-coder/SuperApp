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
  const [search, setSearch] = useState('');
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
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subdomains-${result.domain}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!result?.subdomains?.length) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subdomains-${result.domain}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const subdomains = result?.subdomains || [];
  const filtered = search
    ? subdomains.filter(s =>
        s.subdomain.toLowerCase().includes(search.toLowerCase()) ||
        (s.ips || []).some(ip => ip.includes(search))
      )
    : subdomains;

  const crtCount = subdomains.filter(s => s.source === 'crt.sh').length;
  const dnsCount = subdomains.filter(s => s.source !== 'crt.sh').length;

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
          {subdomains.length > 0 && (
            <>
              <button className="btn-secondary" onClick={exportCSV} style={{ height: 40 }}>📥 Export CSV</button>
              <button className="btn-secondary" onClick={exportJSON} style={{ height: 40 }}>📥 Export JSON</button>
            </>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
          Discovers subdomains via crt.sh certificate transparency logs and common DNS wordlist.
        </p>
      </div>

      {history.length > 0 && !result && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📜 Recent Lookups</h3>
          <div style={{ maxHeight: 100, overflowY: 'auto' }}>
            {history.map((h, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                borderBottom: '1px solid var(--border-color)', fontSize: 13, cursor: 'pointer',
              }} onClick={() => { setDomain(h.domain); }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>
                Found {result.count} subdomains for {result.domain}
              </h3>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ color: 'var(--success)' }}>🔍 crt.sh: {crtCount}</span>
                <span style={{ color: 'var(--warning)' }}>📡 DNS: {dnsCount}</span>
              </div>
            </div>
            {subdomains.length > 0 && (
              <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex' }}>
                {crtCount > 0 && <div style={{ width: `${(crtCount / subdomains.length) * 100}%`, height: '100%', background: 'var(--success)' }} />}
                {dnsCount > 0 && <div style={{ width: `${(dnsCount / subdomains.length) * 100}%`, height: '100%', background: 'var(--warning)' }} />}
              </div>
            )}
          </div>

          {subdomains.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Showing {filtered.length} of {subdomains.length} subdomains
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="🔍 Filter subdomains..." style={{ width: 220, fontSize: 13, padding: '6px 10px' }} />
              </div>

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
                  {filtered.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                      No subdomains match "{search}"
                    </div>
                  ) : (
                    filtered.map((s, i) => (
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
                    ))
                  )}
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <CopyButton text={filtered.map(s => s.subdomain).join('\n')} label="Copy List" />
                <CopyButton text={JSON.stringify(filtered, null, 2)} label="Copy JSON" />
              </div>
            </div>
          )}

          {subdomains.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              No subdomains found for {result.domain}
            </div>
          )}
        </>
      )}
    </div>
  );
}
