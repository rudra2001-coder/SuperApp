import { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function IPInfo() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIPInfo();
  }, []);

  const fetchIPInfo = async () => {
    setLoading(true); setError('');
    try {
      const data = await fetchPublicIPInfoFallback();
      setInfo(data);
    } catch {
      setError('Failed to fetch IP information');
    }
    setLoading(false);
  };

  const fetchPublicIPInfoFallback = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) return await res.json();
    } catch { }
    try {
      const res = await fetch('https://ip-api.com/json/');
      if (res.ok) {
        const d = await res.json();
        return {
          ip: d.query,
          city: d.city,
          region: d.regionName,
          country: d.country,
          org: d.isp,
          timezone: d.timezone,
          asn: d.as,
          latitude: d.lat,
          longitude: d.lon,
        };
      }
    } catch { }
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      if (res.ok) {
        const d = await res.json();
        return { ip: d.ip, org: 'Unknown', city: 'Unknown', country: 'Unknown' };
      }
    } catch { }
    throw new Error('All IP APIs failed');
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
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🖥️ Your IP Information</h2>

      {error && <ErrorMessage message={error} onRetry={fetchIPInfo} />}
      {loading && <LoadingSpinner text="Detecting your IP..." />}

      {info && !info.error && (
        <div className="card">
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>🌍</div>
          <Field label="IP Address" value={info.ip} />
          <Field label="City" value={info.city} />
          <Field label="Region" value={info.region} />
          <Field label="Country" value={info.country_name || info.country} />
          <Field label="ISP / Organization" value={info.org} />
          <Field label="Timezone" value={info.timezone} />
          <Field label="ASN" value={info.asn || info.as} />
          {info.latitude && info.longitude && (
            <Field label="Coordinates" value={`${info.latitude}, ${info.longitude}`} />
          )}
          <button className="btn-secondary" onClick={fetchIPInfo} style={{ marginTop: 16 }}>
            🔄 Refresh
          </button>
        </div>
      )}
    </div>
  );
}
