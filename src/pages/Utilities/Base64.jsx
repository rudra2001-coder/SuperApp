import { useState } from 'react';
import CopyButton from '../../components/common/CopyButton';

export default function Base64() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const process = () => {
    setError('');
    try {
      if (mode === 'encode') {
        setOutput(btoa(input));
      } else {
        setOutput(atob(input));
      }
    } catch {
      setError(mode === 'encode' ? 'Encoding failed' : 'Invalid Base64 string');
      setOutput('');
    }
  };

  const handleFileEncode = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setMode('encode');
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1] || reader.result;
      setInput(base64);
      setOutput(base64);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🔐 Base64 {mode === 'encode' ? 'Encode' : 'Decode'}</h2>
      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button className={mode === 'encode' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => { setMode('encode'); setOutput(''); setError(''); }}>Encode</button>
          <button className={mode === 'decode' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => { setMode('decode'); setOutput(''); setError(''); }}>Decode</button>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            📁 Encode File
            <input type="file" style={{ display: 'none' }} onChange={handleFileEncode} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {mode === 'encode' ? 'Plain Text' : 'Base64 String'}
            {fileName && <span style={{ marginLeft: 8, fontSize: 12 }}>({fileName})</span>}
          </label>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            rows={5} style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace' }}
            placeholder={mode === 'encode' ? 'Enter text...' : 'Enter Base64...'} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="btn-primary" onClick={process}>{mode === 'encode' ? 'Encode →' : 'Decode →'}</button>
          <button className="btn-secondary" onClick={() => { setInput(''); setOutput(''); setError(''); setFileName(''); }}>Clear</button>
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 8 }}>{error}</p>}
        {output && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Result</label>
              <CopyButton text={output} />
            </div>
            <textarea readOnly value={output} rows={5} style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace' }} />
          </div>
        )}
        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', fontSize: 13 }}>
          <strong>Tip:</strong> Use "Encode File" to convert any file to Base64 data URI.
        </div>
      </div>
    </div>
  );
}
