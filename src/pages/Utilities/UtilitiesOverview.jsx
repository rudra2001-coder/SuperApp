import { useState } from 'react';
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
  { path: 'excel-validator', label: 'Excel Validator', desc: 'Validate Excel structure & data types', icon: '✅' },
  { path: 'isp-excel-validator', label: 'ISP Excel Validator', desc: 'Validate & auto-fix ISP client Excel data', icon: '📊' },
  { path: 'pdf-to-excel', label: 'PDF to Excel', desc: 'Extract PDF text to Excel spreadsheets', icon: '📄➡️📊' },
];

export default function UtilitiesOverview() {
  const [search, setSearch] = useState('');
  const filtered = tools.filter(t =>
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>🧰 Utilities</h1>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search utilities..." style={{ width: 240, fontSize: 13, padding: '8px 14px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {filtered.length > 0 ? filtered.map(tool => (
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
        )) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            No tools match "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
