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
];

export default function NetworkOverview() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🌐 Network Tools</h1>
      <div className="grid-3">
        {tools.map(tool => (
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
