import { Link } from 'react-router-dom';

const tools = [
  { path: 'base64', label: 'Base64', desc: 'Encode/decode text', icon: '🔐' },
  { path: 'uuid', label: 'UUID Generator', desc: 'Generate random UUIDs', icon: '🆔' },
  { path: 'password', label: 'Password Generator', desc: 'Strong random passwords', icon: '🔑' },
  { path: 'qr', label: 'QR Code', desc: 'Generate QR codes from text', icon: '📱' },
  { path: 'hasher', label: 'File Hasher', desc: 'Compute MD5, SHA-1, SHA-256', icon: '🔑' },
  { path: 'json-formatter', label: 'JSON Formatter', desc: 'Format & validate JSON', icon: '📋' },
  { path: 'color-converter', label: 'Color Converter', desc: 'Convert between HEX, RGB, HSL', icon: '🎨' },
  { path: 'text-case', label: 'Text Case', desc: 'Convert text between cases', icon: '🔤' },
  { path: 'url-encode', label: 'URL Encode', desc: 'Encode/decode URLs', icon: '🔗' },
  { path: 'unit-converter', label: 'Unit Converter', desc: 'Length, weight, temp, data', icon: '📏' },
  { path: 'timer', label: 'Timer & Stopwatch', desc: 'Countdown timer with lap support', icon: '⏱️' },
  { path: 'lorem-ipsum', label: 'Lorem Ipsum', desc: 'Generate placeholder text', icon: '📝' },
  { path: 'text-analyzer', label: 'Text Analyzer', desc: 'Count chars, words, frequency', icon: '📊' },
  { path: 'number-base', label: 'Number Base', desc: 'Bin/Oct/Dec/Hex converter', icon: '🔢' },
  { path: 'epoch-converter', label: 'Epoch Converter', desc: 'Timestamp ↔ date', icon: '🕐' },
  { path: 'regex-tester', label: 'Regex Tester', desc: 'Test & highlight regex matches', icon: '🔍' },
];

export default function UtilitiesOverview() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🧰 Utilities</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {tools.map(tool => (
          <Link key={tool.path} to={tool.path} style={{ textDecoration: 'none' }}>
            <div className="card" style={{
              cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', padding: 16,
              textAlign: 'center',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
            >
              <p style={{ fontSize: 28, marginBottom: 6 }}>{tool.icon}</p>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, color: 'var(--text-primary)' }}>{tool.label}</h3>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{tool.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
