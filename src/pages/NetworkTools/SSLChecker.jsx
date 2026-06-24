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

  const lookup = async () => {
    if (!form.host.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await checkSSLCert(form.host.trim(), parseInt(form.port) || 443);
      if (data.error) { setError(data.error); return; }
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
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
      </div>

      {error && <ErrorMessage message={error} />}
      {loading && <LoadingSpinner text="Inspecting certificate..." />}

      {result && !loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div className="card">
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📋 Subject</h4>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <Field label="Common Name (CN)" value={result.subject.commonName} />
                <Field label="Organization (O)" value={result.subject.organization} />
                <Field label="Country (C)" value={result.subject.country} />
              </div>
            </div>
            <div className="card">
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🏛️ Issuer</h4>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <Field label="Common Name (CN)" value={result.issuer.commonName} />
                <Field label="Organization (O)" value={result.issuer.organization} />
                <Field label="Country (C)" value={result.issuer.country} />
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
    </div>
  );
}
