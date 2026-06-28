import { useState } from 'react';
import { checkHTTPHeaders } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import CopyButton from '../../components/common/CopyButton';

const SECURITY_HEADERS = [
  { key: 'strict-transport-security', label: 'HSTS', desc: 'HTTP Strict Transport Security', critical: true },
  { key: 'x-frame-options', label: 'X-Frame-Options', desc: 'Clickjacking protection', critical: true },
  { key: 'x-content-type-options', label: 'X-Content-Type-Options', desc: 'MIME-sniffing prevention', critical: true },
  { key: 'content-security-policy', label: 'CSP', desc: 'Content Security Policy', critical: true },
  { key: 'x-xss-protection', label: 'X-XSS-Protection', desc: 'Cross-site scripting filter', critical: false },
  { key: 'referrer-policy', label: 'Referrer-Policy', desc: 'Referrer information control', critical: false },
  { key: 'permissions-policy', label: 'Permissions-Policy', desc: 'Browser feature permissions', critical: false },
  { key: 'access-control-allow-origin', label: 'CORS', desc: 'Cross-Origin Resource Sharing', critical: false },
];

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

  const calcSecurityScore = (headers) => {
    if (!headers) return { score: 0, max: 8, found: 0, details: [] };
    const details = SECURITY_HEADERS.map(sh => {
      const found = !!headers[sh.key];
      return { ...sh, found };
    });
    const found = details.filter(d => d.found).length;
    const score = Math.round((found / SECURITY_HEADERS.length) * 100);
    return { score, max: SECURITY_HEADERS.length, found, details };
  };

  const parseCookies = (headers) => {
    if (!headers) return [];
    const raw = headers['set-cookie'];
    if (!raw) return [];
    const cookies = Array.isArray(raw) ? raw : [raw];
    return cookies.map(c => {
      const parts = c.split(';').map(p => p.trim());
      const nameVal = parts[0].split('=');
      const flags = parts.slice(1);
      return {
        name: nameVal[0],
        value: nameVal.slice(1).join('='),
        secure: flags.some(f => f.toLowerCase() === 'secure'),
        httponly: flags.some(f => f.toLowerCase() === 'httponly'),
        samesite: flags.find(f => f.toLowerCase().startsWith('samesite=')),
      };
    });
  };

  const exportReport = () => {
    if (!result) return;
    const security = calcSecurityScore(result.headers);
    const cookies = parseCookies(result.headers);
    const report = {
      url: result.url,
      statusCode: result.statusCode,
      httpVersion: result.httpVersion,
      timing: result.timing,
      securityScore: security.score,
      securityHeaders: security.details,
      cookieCount: cookies.length,
      totalHeaders: Object.keys(result.headers || {}).length,
      headers: result.headers,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const urlObj = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = `headers-report-${new URL(result.url).hostname}.json`;
    a.click();
    URL.revokeObjectURL(urlObj);
  };

  const headerGroups = [
    { label: 'General', keys: ['content-type', 'content-length', 'server', 'date'] },
    { label: 'Caching', keys: ['cache-control', 'expires', 'pragma', 'age'] },
    { label: 'Security', keys: SECURITY_HEADERS.map(h => h.key) },
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>
                  {result.url}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  HTTP/{result.httpVersion} · {result.timing?.total}ms total
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: getStatusColor(result.statusCode) + '22',
                  color: getStatusColor(result.statusCode),
                }}>
                  {result.statusCode} {result.statusMessage}
                </span>
                <button className="btn-secondary btn-sm" onClick={exportReport} style={{ fontSize: 11 }}>📥 Report</button>
              </div>
            </div>

            {result.headers && (() => {
              const security = calcSecurityScore(result.headers);
              const color = security.score >= 80 ? 'var(--success)' : security.score >= 50 ? 'var(--warning)' : 'var(--danger)';
              return (
                <div style={{ marginTop: 8, padding: '12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>🛡️ Security Score</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color }}>{security.score}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-primary)', overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: `${security.score}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {security.details.map(d => (
                      <span key={d.key} style={{
                        padding: '3px 8px', borderRadius: 10, fontSize: 11,
                        background: d.found ? 'rgba(67,181,129,0.15)' : 'rgba(239,71,111,0.15)',
                        color: d.found ? 'var(--success)' : 'var(--danger)',
                        border: '1px solid',
                        borderColor: d.found ? 'var(--success)' : 'var(--danger)',
                      }}>
                        {d.found ? '✅' : '❌'} {d.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {result.headers && (() => {
              const cookies = parseCookies(result.headers);
              if (cookies.length === 0) return null;
              return (
                <div style={{ marginTop: 8, padding: '12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🍪 Cookies ({cookies.length})</div>
                  {cookies.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', fontSize: 12, borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontWeight: 600, minWidth: 120 }}>{c.name}</span>
                      <span style={{ color: c.secure ? 'var(--success)' : 'var(--danger)', fontSize: 11 }}>
                        {c.secure ? '🔒 Secure' : '⚠️ No Secure'}
                      </span>
                      <span style={{ color: c.httponly ? 'var(--success)' : 'var(--danger)', fontSize: 11 }}>
                        {c.httponly ? '🔒 HttpOnly' : '⚠️ No HttpOnly'}
                      </span>
                      {c.samesite && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.samesite}</span>}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {headerGroups.map(group => {
            const matching = group.keys.length > 0
              ? Object.entries(result.headers || {}).filter(([k]) => group.keys.includes(k))
              : Object.entries(result.headers || {}).filter(([k]) => !headerGroups.some(g => g.keys.length > 0 && g.keys.includes(k)));

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
