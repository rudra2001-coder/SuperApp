import { useState } from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import CopyButton from '../../components/common/CopyButton';
import { dnsLookup } from '../../utils/api';

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'SOA', 'SRV'];

export default function DNSLookup() {
  const [domain, setDomain] = useState('');
  const [activeTab, setActiveTab] = useState('A');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulkDomains, setBulkDomains] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [bulkResults, setBulkResults] = useState([]);

  const lookup = async () => {
    if (!domain.trim()) return;
    setLoading(true); setError(''); setRecords([]);
    try {
      const data = await dnsLookup(domain.trim());
      const filtered = (data.records || []).filter(r => r.type === activeTab);
      setRecords(filtered.length > 0 ? filtered : data.records || []);
    } catch { setError('DNS lookup failed'); }
    setLoading(false);
  };

  const bulkLookup = async () => {
    const domains = bulkDomains.split('\n').map(d => d.trim()).filter(d => d);
    if (domains.length === 0) return;
    setLoading(true); setError(''); setBulkResults([]);
    const results = [];
    for (const d of domains) {
      try {
        const data = await dnsLookup(d);
        const a = data.records?.filter(r => r.type === 'A').map(r => r.value).join(', ') || '';
        const mx = data.records?.filter(r => r.type === 'MX').map(r => r.value).join(', ') || '';
        const ns = data.records?.filter(r => r.type === 'NS').map(r => r.value).join(', ') || '';
        results.push({ domain: d, a: a || '—', mx: mx || '—', ns: ns || '—' });
      } catch {
        results.push({ domain: d, a: 'Error', mx: 'Error', ns: 'Error' });
      }
      setBulkResults([...results]);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🔍 DNS Lookup</h2>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: showBulk ? 12 : 0 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input value={domain} onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup()}
              placeholder="example.com" style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {RECORD_TYPES.map(type => (
              <button key={type}
                onClick={() => { setActiveTab(type); if (domain) setTimeout(lookup, 0); }}
                style={{
                  padding: '6px 10px', borderRadius: 'var(--radius)', fontSize: 12,
                  background: activeTab === type ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: activeTab === type ? '#fff' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 500,
                }}>{type}</button>
            ))}
          </div>
          <button className="btn-primary" onClick={lookup} disabled={loading} style={{ height: 40 }}>
            {loading ? '⏳' : '🔍 Lookup'}
          </button>
          <button className="btn-secondary" onClick={() => setShowBulk(!showBulk)} style={{ height: 40 }}>
            📋 Bulk
          </button>
        </div>
        {showBulk && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
            <textarea value={bulkDomains} onChange={e => setBulkDomains(e.target.value)}
              rows={4} style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, marginBottom: 8 }}
              placeholder="one domain per line:&#10;google.com&#10;github.com&#10;stackoverflow.com" />
            <button className="btn-primary btn-sm" onClick={bulkLookup} disabled={loading}>🔍 Lookup All</button>
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} />}
      {loading && <LoadingSpinner text="Querying DNS..." />}

      {records.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            {activeTab} Records for {domain}
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Value</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>TTL</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Copy</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px' }}><span className="badge badge-success">{r.type}</span></td>
                  <td style={{ padding: '8px 12px', fontSize: 13 }}>{r.name}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>{r.value}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{r.ttl}s</td>
                  <td style={{ padding: '8px 12px' }}><CopyButton text={r.value} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {bulkResults.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Bulk Results</h3>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Domain</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>A Records</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>MX Records</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>NS Records</th>
                </tr>
              </thead>
              <tbody>
                {bulkResults.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.domain}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 12 }}>{r.a}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 12 }}>{r.mx}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 12 }}>{r.ns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8 }}><CopyButton text={JSON.stringify(bulkResults, null, 2)} /></div>
        </div>
      )}
    </div>
  );
}
