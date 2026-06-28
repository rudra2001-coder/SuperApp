import { useState } from 'react';
import { checkSSLCert } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import CopyButton from '../../components/common/CopyButton';

export default function SSLChecker() {
  const [form, setForm] = useState({ host: '', port: '443' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [batchResults, setBatchResults] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('superapp-ssl-history') || '[]'); } catch { return []; }
  });

  const lookup = async () => {
    if (!form.host.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await checkSSLCert(form.host.trim(), parseInt(form.port) || 443);
      if (data.error) { setError(data.error); setLoading(false); return; }
      setResult(data);
      const entry = { host: form.host.trim(), port: form.port, timestamp: new Date().toISOString(), daysLeft: data.daysLeft, expired: data.expired };
      const updated = [entry, ...history.filter(h => h.host !== form.host.trim())].slice(0, 20);
      setHistory(updated);
      localStorage.setItem('superapp-ssl-history', JSON.stringify(updated));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const batchCheck = async () => {
    const hosts = batchInput.split('\n').map(h => h.trim()).filter(h => h);
    if (hosts.length === 0) return;
    setBatchLoading(true); setError(''); setBatchResults([]);
    const results = [];
    for (const host of hosts) {
      try {
        const data = await checkSSLCert(host, 443);
        results.push({ host, status: data.expired ? 'expired' : 'valid', daysLeft: data.daysLeft, issuer: data.issuer?.commonName, subject: data.subject?.commonName, error: null });
      } catch (err) {
        results.push({ host, status: 'error', daysLeft: null, issuer: null, subject: null, error: err.response?.data?.error || err.message });
      }
    }
    setBatchResults(results);
    setBatchLoading(false);
  };

  const loadFromHistory = (entry) => {
    setForm({ host: entry.host, port: entry.port });
    setResult(null);
    setError('');
  };

  const daysColor = (days) => {
    if (days < 0) return 'var(--danger)';
    if (days < 30) return 'var(--warning)';
    return 'var(--success)';
  };

  const Field = ({ label, value, color }) => (
    <div style={{
      padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: color || 'var(--text-primary)' }}>{value || '—'}</span>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🔒 SSL Certificate Checker</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input value={form.host} onChange={e => setForm({ ...form, host: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && lookup()}
              placeholder="example.com" style={{ width: '100%' }} />
          </div>
          <div style={{ width: 100 }}>
            <input value={form.port} onChange={e => setForm({ ...form, port: e.target.value })}
              placeholder="443" style={{ width: '100%' }} />
          </div>
          <button className="btn-primary" onClick={lookup} disabled={loading} style={{ height: 40 }}>
            {loading ? '⏳' : '🔍 Check SSL'}
          </button>
        </div>

        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
            Batch Check (paste multiple hosts)
          </summary>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <textarea value={batchInput} onChange={e => setBatchInput(e.target.value)}
              rows={4} style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
              placeholder="example.com&#10;google.com&#10;github.com" />
            <button className="btn-primary" onClick={batchCheck} disabled={batchLoading} style={{ height: 40, alignSelf: 'flex-end' }}>
              {batchLoading ? '⏳' : '📥 Check All'}
            </button>
          </div>
        </details>
      </div>

      {history.length > 0 && !result && batchResults.length === 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>📜 Recent Checks</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {history.map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                borderRadius: 'var(--radius)', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)', fontSize: 12, cursor: 'pointer',
              }} onClick={() => loadFromHistory(h)}>
                <span style={{ fontWeight: 600 }}>{h.host}</span>
                <span style={{ color: daysColor(h.daysLeft), fontSize: 11 }}>
                  {h.expired ? 'Expired' : `${h.daysLeft}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} />}
      {loading && <LoadingSpinner text="Inspecting certificate..." />}

      {result && !loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div className="card">
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📋 Subject</h4>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <Field label="Common Name (CN)" value={result.subject?.commonName} />
                <Field label="Organization (O)" value={result.subject?.organization} />
                <Field label="Country (C)" value={result.subject?.country} />
              </div>
            </div>
            <div className="card">
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🏛️ Issuer</h4>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <Field label="Common Name (CN)" value={result.issuer?.commonName} />
                <Field label="Organization (O)" value={result.issuer?.organization} />
                <Field label="Country (C)" value={result.issuer?.country} />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>⏱️ Validity</h4>
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <Field label="Valid From" value={result.validFrom ? new Date(result.validFrom).toLocaleString() : '—'} />
              <Field label="Valid To" value={result.validTo ? new Date(result.validTo).toLocaleString() : '—'} />
              <Field label="Days Remaining" value={result.daysLeft !== undefined ? `${result.daysLeft} days` : '—'} color={daysColor(result.daysLeft)} />
              <Field label="Status" value={result.expired ? '❌ EXPIRED' : '✅ Valid'} color={result.expired ? 'var(--danger)' : 'var(--success)'} />
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🔐 Certificate Details</h4>
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <Field label="Signature Algorithm" value={result.signatureAlgorithm} />
              <Field label="Key Size" value={result.bits ? `${result.bits} bits` : '—'} />
              <Field label="Serial Number" value={result.serialNumber} />
              <Field label="SHA1 Fingerprint" value={result.fingerprint} />
              <Field label="SHA256 Fingerprint" value={result.fingerprint256} />
            </div>
          </div>

          {result.subjectAltNames?.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🌐 Subject Alternative Names (SANs)</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.subjectAltNames.map((san, i) => (
                  <span key={i} style={{
                    padding: '4px 12px', borderRadius: 12, fontSize: 12,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  }}>{san}</span>
                ))}
              </div>
            </div>
          )}

          <CopyButton text={JSON.stringify(result, null, 2)} />
        </>
      )}

      {batchLoading && <LoadingSpinner text="Batch checking certificates..." />}

      {batchResults.length > 0 && !batchLoading && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Batch Results ({batchResults.filter(r => r.status === 'valid').length} valid, {batchResults.filter(r => r.status === 'expired').length} expired, {batchResults.filter(r => r.status === 'error').length} errors)
          </h3>
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div style={{
              display: 'flex', padding: '10px 14px', fontWeight: 600, fontSize: 13,
              background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
            }}>
              <span style={{ flex: 2 }}>Host</span>
              <span style={{ flex: 1 }}>Status</span>
              <span style={{ flex: 1 }}>Days Left</span>
              <span style={{ flex: 1.5 }}>Issuer</span>
            </div>
            {batchResults.map((r, i) => (
              <div key={i} style={{
                display: 'flex', padding: '8px 14px', fontSize: 13, alignItems: 'center',
                borderBottom: i < batchResults.length - 1 ? '1px solid var(--border-color)' : 'none',
                background: r.status === 'expired' ? 'rgba(239,71,111,0.05)' : r.status === 'error' ? 'rgba(239,71,111,0.05)' : 'transparent',
              }}>
                <span style={{ flex: 2, fontWeight: 600 }}>{r.host}</span>
                <span style={{ flex: 1 }}>
                  {r.status === 'valid' ? <span className="badge badge-success">✅ Valid</span> :
                   r.status === 'expired' ? <span className="badge badge-danger">❌ Expired</span> :
                   <span className="badge badge-danger">{r.error || '❌ Error'}</span>}
                </span>
                <span style={{ flex: 1, color: daysColor(r.daysLeft), fontWeight: 600 }}>
                  {r.daysLeft !== null ? `${r.daysLeft}d` : '—'}
                </span>
                <span style={{ flex: 1.5, color: 'var(--text-secondary)', fontSize: 12 }}>{r.issuer || '—'}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <CopyButton text={JSON.stringify(batchResults, null, 2)} label="Copy Results" />
          </div>
        </div>
      )}
    </div>
  );
}
