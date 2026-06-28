import { useState } from 'react';
import { Link } from 'react-router-dom';

const tools = [
  { path: 'ping', label: 'Ping', desc: 'Test reachability and latency', icon: '📶' },
  { path: 'port-scanner', label: 'Port Scanner', desc: 'Scan open ports on a host', icon: '🔌' },
  { path: 'dns-lookup', label: 'DNS Lookup', desc: 'Query DNS records', icon: '🔍' },
  { path: 'whois', label: 'WHOIS', desc: 'Lookup domain registration', icon: '🏛️' },
  { path: 'traceroute', label: 'Traceroute', desc: 'Trace network path', icon: '🗺️' },
  { path: 'ip-info', label: 'IP Info', desc: 'Your public IP & geolocation', icon: '🖥️' },
  { path: 'mikrotik', label: 'MikroTik Checker', desc: 'Test API credentials & system info', icon: '🔐' },
  { path: 'http-headers', label: 'HTTP Headers', desc: 'Inspect HTTP response headers', icon: '🌐' },
  { path: 'ssl-cert', label: 'SSL Certificate', desc: 'Check SSL cert validity & details', icon: '🔒' },
  { path: 'snmp', label: 'SNMP Checker', desc: 'Test SNMP & retrieve system info', icon: '📡' },
  { path: 'http-requester', label: 'HTTP Request Tester', desc: 'Send HTTP requests with custom headers & body', icon: '📮' },
  { path: 'subdomain-discovery', label: 'Subdomain Discovery', desc: 'Discover subdomains via crt.sh & DNS', icon: '🔍' },
  { path: 'network-calc', label: 'Network Calculator', desc: 'CIDR calculator & IP range converter', icon: '🧮' },
  { path: 'scenario-runner', label: 'Scenario Runner', desc: 'Multi-step network check playbooks', icon: '🎯' },
  { path: 'dashboard', label: 'Network Dashboard', desc: 'Real-time multi-target monitoring', icon: '📊' },
  { path: 'ssl-monitor', label: 'SSL Expiry Monitor', desc: 'Track SSL cert expiry with warnings', icon: '🔒' },
  { path: 'scan-campaigns', label: 'Scan Campaigns', desc: 'Recon campaigns: subdomain + port scan', icon: '🎯' },
  { path: 'preferences', label: 'Preferences', desc: 'User settings & history retention', icon: '⚙️' },
];

export default function NetworkOverview() {
  const [search, setSearch] = useState('');
  const filtered = tools.filter(t =>
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>🌐 Network Tools</h1>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search tools..." style={{ width: 240, fontSize: 13, padding: '8px 14px' }} />
      </div>
      {filtered.length === 0 && search && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
          No tools match "{search}"
        </div>
      )}
      <div className="grid-3">
        {filtered.map(tool => (
          <Link key={tool.path} to={tool.path} style={{ textDecoration: 'none' }}>
            <div className="card" style={{
              cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
            >
              <p style={{ fontSize: 36, marginBottom: 8 }}>{tool.icon}</p>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{tool.label}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{tool.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
