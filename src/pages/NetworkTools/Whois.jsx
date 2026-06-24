import { useState } from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import CopyButton from '../../components/common/CopyButton';

function simulateWhois(query) {
  const base = query.replace(/^www\./, '');
  return {
    domain: query,
    registrar: 'NameCheap, Inc.',
    created: new Date(Date.now() - 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    updated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nameServers: ['ns1.' + base, 'ns2.' + base],
    registrant: 'WhoisGuard Protected',
    organization: 'WhoisGuard, Inc.',
    country: 'US',
    state: 'Arizona',
    emails: ['abuse@namecheap.com'],
  };
}

export default function Whois() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(''); setData(null);
    try {
      await new Promise(r => setTimeout(r, 800));
      setData(simulateWhois(query.trim()));
    } catch {
      setError('WHOIS lookup failed');
    }
    setLoading(false);
  };

  const Field = ({ label, value }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '10px 0',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: 14 }}>{value || '—'}</span>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🏛️ WHOIS Lookup</h2>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup()}
              placeholder="example.com or IP address" style={{ width: '100%' }} />
          </div>
          <button className="btn-primary" onClick={lookup} disabled={loading} style={{ height: 40 }}>
            {loading ? 'Looking up...' : '🔍 Lookup'}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {loading && <LoadingSpinner text="Querying WHOIS..." />}

      {data && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Results for {data.domain}</h3>
            <CopyButton text={JSON.stringify(data, null, 2)} />
          </div>
          <Field label="Registrar" value={data.registrar} />
          <Field label="Created" value={data.created} />
          <Field label="Expiration" value={data.expires} />
          <Field label="Updated" value={data.updated} />
          <Field label="Name Servers" value={data.nameServers.join(', ')} />
          <Field label="Registrant" value={data.registrant} />
          <Field label="Organization" value={data.organization} />
          <Field label="Country" value={data.country} />
          <Field label="State" value={data.state} />
          <Field label="Abuse Email" value={data.emails.join(', ')} />
        </div>
      )}
    </div>
  );
}
