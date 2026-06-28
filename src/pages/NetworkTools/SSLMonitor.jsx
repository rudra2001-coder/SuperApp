import { useState } from 'react';
import { checkSSLCert } from '../../utils/api';
import { useSupabaseStorage } from '../../hooks/useSupabaseStorage';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import CopyButton from '../../components/common/CopyButton';

export default function SSLMonitor() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [certificates, setCertificates] = useSupabaseStorage('ssl_certificates', 'superapp-ssl-certificates', []);

  const addDomain = async () => {
    if (!domain.trim()) return;
    setLoading(true); setError('');
    try {
      const data = await checkSSLCert(domain.trim());
      if (data.error) { setError(data.error); setLoading(false); return; }
      const entry = {
        domain: domain.trim(),
        expires_at: data.validTo,
        days_left: data.daysLeft,
        expired: data.expired,
        issuer: data.issuer?.commonName || 'Unknown',
        subject: data.subject?.commonName || 'Unknown',
        last_check: new Date().toISOString(),
        simulated: false,
      };
      const existing = certificates.findIndex(c => c.domain === domain.trim());
      const updated = existing >= 0
        ? certificates.map((c, i) => i === existing ? entry : c)
        : [entry, ...certificates];
      setCertificates(updated.slice(0, 50));
      setDomain('');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const checkAll = async () => {
    if (certificates.length === 0) return;
    setLoading(true); setError('');
    const updated = [];
    for (const cert of certificates) {
      try {
        const data = await checkSSLCert(cert.domain);
        updated.push({
          ...cert,
          expires_at: data.validTo,
          days_left: data.daysLeft,
          expired: data.expired,
          issuer: data.issuer?.commonName || 'Unknown',
          subject: data.subject?.commonName || 'Unknown',
          last_check: new Date().toISOString(),
          simulated: false,
        });
      } catch {
        updated.push({ ...cert, last_check: new Date().toISOString() });
      }
    }
    setCertificates(updated);
    setLoading(false);
  };

  const removeDomain = (domainName) => {
    setCertificates(certificates.filter(c => c.domain !== domainName));
  };

  const daysColor = (days) => {
    if (days === undefined || days === null) return 'var(--text-secondary)';
    if (days < 0) return 'var(--danger)';
    if (days < 30) return 'var(--warning)';
    return 'var(--success)';
  };

  const daysBadge = (days) => {
    if (days === undefined || days === null) return <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>❓ Unknown</span>;
    if (days < 0) return <span className="badge badge-danger">🚨 Expired</span>;
    if (days < 7) return <span className="badge badge-danger">⚠️ {days}d</span>;
    if (days < 30) return <span className="badge badge-warning">⚠️ {days}d</span>;
    return <span className="badge badge-success">🔒 {days}d</span>;
  };

  const sorted = [...certificates].sort((a, b) => (a.days_left ?? 999) - (b.days_left ?? 999));

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🔒 SSL Expiry Monitor</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Track SSL certificate expiry for your domains. Items with &lt;30 days are highlighted.
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <input value={domain} onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDomain()}
              placeholder="example.com" style={{ width: '100%' }} />
          </div>
          <button className="btn-primary" onClick={addDomain} disabled={loading} style={{ height: 40 }}>
            {loading ? '⏳' : '➕ Add Domain'}
          </button>
          {certificates.length > 0 && (
            <button className="btn-secondary" onClick={checkAll} disabled={loading} style={{ height: 40 }}>
              🔄 Check All
            </button>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => { setError(''); }} />}
      {loading && <LoadingSpinner text="Checking certificates..." />}

      {certificates.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>
          No domains added yet. Add a domain above to start tracking SSL expiry.
        </div>
      )}

      {sorted.length > 0 && !loading && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Tracked Domains ({sorted.length})</h3>
            <CopyButton text={sorted.map(c => `${c.domain}: ${c.days_left ?? '?'}d`).join('\n')} label="Copy Summary" />
          </div>

          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div style={{
              display: 'flex', padding: '10px 14px', fontWeight: 600, fontSize: 13,
              background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
            }}>
              <span style={{ flex: 2 }}>Domain</span>
              <span style={{ flex: 1.5 }}>Issuer</span>
              <span style={{ flex: 1 }}>Expires</span>
              <span style={{ flex: 0.8 }}>Status</span>
              <span style={{ flex: 1 }}>Last Check</span>
              <span style={{ flex: 0.5 }} />
            </div>
            {sorted.map((cert, i) => (
              <div key={cert.domain} style={{
                display: 'flex', padding: '10px 14px', fontSize: 13, alignItems: 'center',
                borderBottom: i < sorted.length - 1 ? '1px solid var(--border-color)' : 'none',
                background: cert.days_left < 7 ? 'rgba(239,71,111,0.05)' : cert.days_left < 30 ? 'rgba(255,209,102,0.05)' : 'transparent',
              }}>
                <span style={{ flex: 2, fontWeight: 600, wordBreak: 'break-all' }}>{cert.domain}</span>
                <span style={{ flex: 1.5, color: 'var(--text-secondary)' }}>{cert.issuer || '—'}</span>
                <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 12 }}>
                  {cert.expires_at ? new Date(cert.expires_at).toLocaleDateString() : '—'}
                </span>
                <span style={{ flex: 0.8 }}>{daysBadge(cert.days_left)}</span>
                <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 12 }}>
                  {cert.last_check ? new Date(cert.last_check).toLocaleDateString() : '—'}
                </span>
                <span style={{ flex: 0.5 }}>
                  <button className="btn-sm" onClick={() => removeDomain(cert.domain)}
                    style={{ color: 'var(--danger)', background: 'transparent', padding: '4px 8px' }}>✕</button>
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--success)' }}>✅ OK: {sorted.filter(c => c.days_left >= 30).length}</span>
            <span style={{ color: 'var(--warning)' }}>⚠️ Expiring: {sorted.filter(c => c.days_left >= 0 && c.days_left < 30).length}</span>
            <span style={{ color: 'var(--danger)' }}>❌ Expired: {sorted.filter(c => c.days_left < 0).length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
