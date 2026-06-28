import { useState } from 'react';
import { discoverSubdomains, scanPorts } from '../../utils/api';
import { useSupabaseStorage } from '../../hooks/useSupabaseStorage';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import CopyButton from '../../components/common/CopyButton';

const COMMON_PORTS = [21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 1433, 1521, 2049, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9090, 27017];

export default function ScanCampaigns() {
  const [form, setForm] = useState({ domain: '', ports: COMMON_PORTS.join(',') });
  const [campaigns, setCampaigns] = useSupabaseStorage('scan_campaigns', 'superapp-scan-campaigns', []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [progress, setProgress] = useState('');

  const createCampaign = async () => {
    if (!form.domain.trim()) return;
    setLoading(true); setError(''); setProgress('Starting campaign...');

    const campaign = {
      id: Date.now().toString(),
      target_domain: form.domain.trim(),
      status: 'running',
      created_at: new Date().toISOString(),
      ports: form.ports.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p)),
      results: [],
    };

    setActiveCampaign(campaign);
    setProgress('Discovering subdomains...');

    try {
      const subData = await discoverSubdomains(campaign.target_domain);
      const subdomains = subData.subdomains || [];

      setProgress(`Found ${subdomains.length} subdomains. Scanning ports...`);

      const allResults = [];
      for (let i = 0; i < subdomains.length; i++) {
        const sub = subdomains[i];
        setProgress(`Scanning ${sub.subdomain} (${i + 1}/${subdomains.length})...`);

        let openPorts = [];
        try {
          const ips = sub.ips || [];
          const target = ips[0] || sub.subdomain;
          const portData = await scanPorts(target, campaign.ports);
          openPorts = (portData.results || []).filter(r => r.status === 'open').map(r => r.port);
        } catch {}

        allResults.push({
          subdomain: sub.subdomain,
          ips: sub.ips || [],
          source: sub.source || 'discovered',
          open_ports: openPorts,
        });
      }

      campaign.status = 'completed';
      campaign.results = allResults;

      const updated = [campaign, ...campaigns].slice(0, 20);
      setCampaigns(updated);
      setActiveCampaign(campaign);
      setProgress(`Completed — ${allResults.length} subdomains scanned, ${allResults.reduce((s, r) => s + r.open_ports.length, 0)} open ports found`);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      campaign.status = 'failed';
      setActiveCampaign(campaign);
      setProgress('Campaign failed');
    }
    setLoading(false);
  };

  const loadCampaign = (c) => {
    setActiveCampaign(c);
    setForm({ ...form, domain: c.target_domain });
  };

  const deleteCampaign = (id) => {
    setCampaigns(campaigns.filter(c => c.id !== id));
    if (activeCampaign?.id === id) setActiveCampaign(null);
  };

  const exportResults = () => {
    if (!activeCampaign?.results) return;
    const csv = 'Subdomain,IPs,Source,Open Ports\n' +
      activeCampaign.results.map(r =>
        `"${r.subdomain}","${(r.ips || []).join('; ')}","${r.source || 'discovered'}","${(r.open_ports || []).join('; ')}"`
      ).join('\n');
    navigator.clipboard.writeText(csv);
    alert('CSV copied to clipboard!');
  };

  const openPortsTotal = activeCampaign?.results?.reduce((s, r) => s + r.open_ports.length, 0) || 0;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🎯 Subdomain & Port Scan Campaigns</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Run multi-step recon: discover subdomains then scan for open ports on each. Results persist to Supabase.
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && !loading && createCampaign()}
              placeholder="example.com" style={{ width: '100%' }} />
          </div>
          <button className="btn-primary" onClick={createCampaign} disabled={loading} style={{ height: 40, whiteSpace: 'nowrap' }}>
            {loading ? '⏳ Running...' : '🚀 Start Campaign'}
          </button>
          {activeCampaign?.results?.length > 0 && (
            <button className="btn-secondary" onClick={exportResults} style={{ height: 40 }}>📋 Export CSV</button>
          )}
        </div>
        <details>
          <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
            Port list ({form.ports.split(',').length} ports)
          </summary>
          <textarea value={form.ports} onChange={e => setForm({ ...form, ports: e.target.value })}
            rows={3} style={{ width: '100%', marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}
            placeholder="Comma-separated port numbers" />
        </details>
      </div>

      {progress && (
        <div className="card" style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
          {loading ? <LoadingSpinner text={progress} /> : <span>✅ {progress}</span>}
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={createCampaign} />}

      {campaigns.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📜 Campaign History</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {campaigns.map((c, i) => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 'var(--radius)', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)', fontSize: 13,
              }}>
                <span style={{ fontWeight: 600 }}>{c.target_domain}</span>
                <span className={`badge ${c.status === 'completed' ? 'badge-success' : c.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                  {c.status === 'completed' ? '✅ Complete' : c.status === 'failed' ? '❌ Failed' : c.status === 'running' ? '⏳ Running' : '⏸ Pending'}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                  {c.results?.length || 0} subs
                </span>
                <button className="btn-sm" onClick={() => loadCampaign(c)}
                  style={{ padding: '2px 8px', background: 'var(--accent)', color: '#fff', borderRadius: 4, fontSize: 11 }}>View</button>
                <button className="btn-sm" onClick={() => deleteCampaign(c.id)}
                  style={{ padding: '2px 8px', background: 'transparent', color: 'var(--danger)', borderRadius: 4, fontSize: 11 }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCampaign?.results?.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>
              Results for {activeCampaign.target_domain}
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {activeCampaign.results.length} subdomains · {openPortsTotal} open ports
            </div>
          </div>

          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div style={{
              display: 'flex', padding: '10px 14px', fontWeight: 600, fontSize: 13,
              background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
            }}>
              <span style={{ flex: 2 }}>Subdomain</span>
              <span style={{ flex: 1.5 }}>IPs</span>
              <span style={{ flex: 1 }}>Open Ports</span>
              <span style={{ flex: 0.5 }}>Source</span>
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {activeCampaign.results.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', padding: '8px 14px', fontSize: 13, alignItems: 'center',
                  borderBottom: i < activeCampaign.results.length - 1 ? '1px solid var(--border-color)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                }}>
                  <span style={{ flex: 2, fontWeight: 600, wordBreak: 'break-all' }}>{r.subdomain}</span>
                  <span style={{ flex: 1.5, color: 'var(--text-secondary)', fontSize: 12 }}>{(r.ips || []).join(', ') || '—'}</span>
                  <span style={{ flex: 1 }}>
                    {r.open_ports?.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {r.open_ports.map(p => (
                          <span key={p} className="badge badge-success" style={{ fontSize: 11, padding: '2px 6px' }}>{p}</span>
                        ))}
                      </div>
                    ) : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                  </span>
                  <span style={{ flex: 0.5, fontSize: 11, color: 'var(--text-secondary)' }}>{r.source}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <CopyButton text={JSON.stringify(activeCampaign.results, null, 2)} />
          </div>
        </div>
      )}
    </div>
  );
}
