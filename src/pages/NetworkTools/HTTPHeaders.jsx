import { useState } from 'react';
import { checkHTTPHeaders } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import CopyButton from '../../components/common/CopyButton';

export default function HTTPHeaders() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await checkHTTPHeaders(url.trim());
      if (data.error) { setError(data.error); return; }
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const getStatusColor = (code) => {
    if (code >= 200 && code < 300) return 'var(--success)';
    if (code >= 300 && code < 400) return 'var(--warning)';
    if (code >= 400) return 'var(--danger)';
    return 'var(--text-secondary)';
  };

  const headerGroups = [
    { label: 'General', keys: ['content-type', 'content-length', 'server', 'date'] },
    { label: 'Caching', keys: ['cache-control', 'expires', 'pragma', 'age'] },
    { label: 'Security', keys: ['strict-transport-security', 'x-frame-options', 'x-content-type-options', 'x-xss-protection', 'content-security-policy', 'referrer-policy', 'permissions-policy'] },
    { label: 'CORS', keys: ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers', 'access-control-expose-headers'] },
    { label: 'Other', keys: [] },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🌐 HTTP Headers Checker</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <input value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup()}
              placeholder="https://example.com" style={{ width: '100%' }} />
          </div>
          <button className="btn-primary" onClick={lookup} disabled={loading} style={{ height: 40 }}>
            {loading ? '⏳' : '🔍 Check Headers'}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {loading && <LoadingSpinner text="Fetching headers..." />}

      {result && !loading && (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>
                {result.url}
              </h3>
              <span style={{
                padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                background: getStatusColor(result.statusCode) + '22',
                color: getStatusColor(result.statusCode),
              }}>
                {result.statusCode} {result.statusMessage}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              HTTP/{result.httpVersion} · {result.timing?.total}ms
            </div>
          </div>

          {headerGroups.map(group => {
            const matching = group.keys.length > 0
              ? Object.entries(result.headers).filter(([k]) => group.keys.includes(k))
              : Object.entries(result.headers).filter(([k]) => !headerGroups.some(g => g.keys.length > 0 && g.keys.includes(k)));

            if (!matching.length) return null;

            return (
              <div key={group.label} className="card" style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                  {group.label} ({matching.length})
                </h4>
                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  {matching.map(([key, val]) => (
                    <div key={key} style={{
                      padding: '8px 14px', display: 'flex',
                      borderBottom: '1px solid var(--border-color)', fontSize: 13,
                      wordBreak: 'break-all',
                    }}>
                      <span style={{ fontWeight: 600, minWidth: 220, color: 'var(--accent)' }}>{key}</span>
                      <span style={{ color: 'var(--text-primary)' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <CopyButton text={JSON.stringify(result.headers, null, 2)} />
        </>
      )}
    </div>
  );
}
