import { NavLink, useLocation } from 'react-router-dom';

const moduleLinks = {
  '/data-processor': [
    { path: '/data-processor', label: 'Dashboard', icon: '📊' },
    { path: '/data-processor/fill-from-sample', label: 'Fill from Sample', icon: '📋' },
    { path: '/data-processor/smart-fill', label: 'Smart Fill', icon: '🔧' },
  ],
  '/network-tools': [
    { path: '/network-tools', label: 'Overview', icon: '📡' },
    { path: '/network-tools/ping', label: 'Ping', icon: '📶' },
    { path: '/network-tools/port-scanner', label: 'Port Scanner', icon: '🔌' },
    { path: '/network-tools/dns-lookup', label: 'DNS Lookup', icon: '🔍' },
    { path: '/network-tools/whois', label: 'WHOIS', icon: '🏛️' },
    { path: '/network-tools/traceroute', label: 'Traceroute', icon: '🗺️' },
    { path: '/network-tools/ip-info', label: 'IP Info', icon: '🖥️' },
    { path: '/network-tools/http-requester', label: 'HTTP Request', icon: '📮' },
    { path: '/network-tools/subdomain-discovery', label: 'Subdomains', icon: '🔍' },
    { path: '/network-tools/network-calc', label: 'Net Calc', icon: '🧮' },
    { path: '/network-tools/scenario-runner', label: 'Scenarios', icon: '🎯' },
    { path: '/network-tools/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/network-tools/ssl-monitor', label: 'SSL Monitor', icon: '🔒' },
    { path: '/network-tools/scan-campaigns', label: 'Campaigns', icon: '🎯' },
    { path: '/network-tools/preferences', label: 'Preferences', icon: '⚙️' },
  ],
  '/utilities': [
    { path: '/utilities', label: 'Overview', icon: '🧰' },
    { path: '/utilities/base64', label: 'Base64', icon: '🔐' },
    { path: '/utilities/uuid', label: 'UUID Generator', icon: '🆔' },
    { path: '/utilities/password', label: 'Password Gen', icon: '🔑' },
    { path: '/utilities/qr', label: 'QR Code', icon: '📱' },
    { path: '/utilities/hasher', label: 'File Hasher', icon: '🔑' },
    { path: '/utilities/json-formatter', label: 'JSON Formatter', icon: '📋' },
    { path: '/utilities/color-converter', label: 'Color Converter', icon: '🎨' },
    { path: '/utilities/text-case', label: 'Text Case', icon: '🔤' },
    { path: '/utilities/url-encode', label: 'URL Encode', icon: '🔗' },
    { path: '/utilities/unit-converter', label: 'Unit Converter', icon: '📏' },
    { path: '/utilities/timer', label: 'Timer', icon: '⏱️' },
    { path: '/utilities/lorem-ipsum', label: 'Lorem Ipsum', icon: '📝' },
    { path: '/utilities/text-analyzer', label: 'Text Analyzer', icon: '📊' },
    { path: '/utilities/number-base', label: 'Number Base', icon: '🔢' },
    { path: '/utilities/epoch-converter', label: 'Epoch Converter', icon: '🕐' },
    { path: '/utilities/regex-tester', label: 'Regex Tester', icon: '🔍' },
    { path: '/utilities/pdf-to-excel', label: 'PDF to Excel', icon: '📄' },
    { path: '/utilities/isp-excel-validator', label: 'ISP Excel Validator', icon: '✅' },
  ],
};

export default function Sidebar() {
  const location = useLocation();
  const base = '/' + location.pathname.split('/')[1];
  const links = moduleLinks[base] || [];

  if (links.length === 0) return null;

  const sidebarStyle = {
    position: 'fixed',
    left: 0,
    top: 56,
    bottom: 0,
    width: 220,
    background: 'var(--bg-card)',
    borderRight: '1px solid var(--border-color)',
    padding: '16px 8px',
    overflowY: 'auto',
    zIndex: 50,
  };

  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s',
    marginBottom: 2,
  };

  return (
    <aside style={sidebarStyle} className="sidebar">
      <button
        className="sidebar-close-btn"
        aria-label="Close sidebar"
        style={{
          display: 'none',
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'transparent',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          color: 'var(--text-secondary)',
          fontSize: 16,
          cursor: 'pointer',
          padding: '4px 8px',
          lineHeight: 1,
          zIndex: 1,
        }}
        onClick={() => {
          const layout = document.querySelector('.app-layout');
          if (layout) layout.classList.remove('sidebar-open');
        }}
      >
        ✕
      </button>
      {links.map(link => (
        <NavLink
          key={link.path}
          to={link.path}
          end={link.path === base}
          style={({ isActive }) => ({
            ...linkStyle,
            background: isActive ? 'var(--accent)' : 'transparent',
            color: isActive ? '#fff' : 'var(--text-secondary)',
          })}
        >
          <span>{link.icon}</span>
          <span>{link.label}</span>
        </NavLink>
      ))}
    </aside>
  );
}
