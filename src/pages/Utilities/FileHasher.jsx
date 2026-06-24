import { useState } from 'react';
import CopyButton from '../../components/common/CopyButton';

const algorithms = [
  { value: 'SHA-256', label: 'SHA-256' },
  { value: 'SHA-1', label: 'SHA-1' },
  { value: 'MD5', label: 'MD5' },
];

async function digestMessage(algorithm, message) {
  if (algorithm === 'MD5') {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function FileHasher() {
  const [fileName, setFileName] = useState('');
  const [algorithm, setAlgorithm] = useState('SHA-256');
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const hashFile = async (file) => {
    if (!file) return;
    setLoading(true); setHash(''); setFileName(file.name);
    const buffer = await file.arrayBuffer();
    let result;
    if (algorithm === 'MD5') {
      const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      result = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      result = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    setHash(result);
    setLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) hashFile(file);
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🔑 File Hasher</h2>
      <div className="card">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16 }}>
          <div style={{ width: 200 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Algorithm</label>
            <select value={algorithm} onChange={e => setAlgorithm(e.target.value)} style={{ width: '100%' }}>
              {algorithms.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <label className="btn-primary" style={{ cursor: 'pointer', height: 40, display: 'flex', alignItems: 'center' }}>
            📁 Browse File
            <input type="file" style={{ display: 'none' }} onChange={e => e.target.files[0] && hashFile(e.target.files[0])} />
          </label>
        </div>
        <div
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center',
            background: dragOver ? 'rgba(67, 97, 238, 0.05)' : 'var(--bg-secondary)',
            transition: 'all 0.2s', cursor: 'pointer',
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.querySelector('#hasher-input').click()}
        >
          <p style={{ fontSize: 32, marginBottom: 8 }}>📄</p>
          <p style={{ color: 'var(--text-secondary)' }}>Drop a file here to compute its hash</p>
          <input id="hasher-input" type="file" style={{ display: 'none' }}
            onChange={e => e.target.files[0] && hashFile(e.target.files[0])} />
        </div>
        {loading && <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-secondary)' }}>Computing hash...</p>}
        {hash && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {algorithm} hash of <strong>{fileName}</strong>
            </p>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              padding: '12px 16px', background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius)', fontFamily: 'monospace', fontSize: 13,
              wordBreak: 'break-all',
            }}>
              <span style={{ flex: 1 }}>{hash}</span>
              <CopyButton text={hash} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
