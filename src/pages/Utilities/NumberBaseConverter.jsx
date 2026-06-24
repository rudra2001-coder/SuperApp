import { useState } from 'react';
import CopyButton from '../../components/common/CopyButton';

const bases = [
  { id: 'bin', label: 'Binary', radix: 2, prefix: '0b' },
  { id: 'oct', label: 'Octal', radix: 8, prefix: '0o' },
  { id: 'dec', label: 'Decimal', radix: 10, prefix: '' },
  { id: 'hex', label: 'Hexadecimal', radix: 16, prefix: '0x' },
];

export default function NumberBaseConverter() {
  const [input, setInput] = useState('');
  const [fromBase, setFromBase] = useState('dec');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const convert = () => {
    setError('');
    if (!input.trim()) { setResults([]); return; }
    const from = bases.find(b => b.id === fromBase);
    const value = parseInt(input.trim(), from.radix);
    if (isNaN(value)) {
      setError(`Invalid ${from.label} value`);
      setResults([]);
      return;
    }
    setResults(bases.map(b => ({
      label: b.label,
      value: value.toString(b.radix).toUpperCase(),
    })));
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🔢 Number Base Converter</h2>
      <div className="card">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Value</label>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && convert()}
              placeholder={fromBase === 'bin' ? '1010' : fromBase === 'oct' ? '12' : fromBase === 'hex' ? 'FF' : '255'}
              style={{ width: '100%', fontFamily: 'monospace' }} />
          </div>
          <div style={{ width: 160 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>From</label>
            <select value={fromBase} onChange={e => setFromBase(e.target.value)} style={{ width: '100%' }}>
              {bases.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={convert} style={{ height: 40 }}>Convert</button>
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}
        {results.length > 0 && (
          <div>
            {results.map(r => (
              <div key={r.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
              }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{r.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 600 }}>{r.value}</span>
                  <CopyButton text={r.value} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
