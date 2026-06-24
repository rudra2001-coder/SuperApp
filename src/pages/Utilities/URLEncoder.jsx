import { useState } from 'react';
import CopyButton from '../../components/common/CopyButton';

export default function URLEncoder() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');
  const [error, setError] = useState('');

  const process = () => {
    setError('');
    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input));
      } else {
        setOutput(decodeURIComponent(input));
      }
    } catch {
      setError('Invalid URL encoding');
      setOutput('');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🔗 URL Encoder / Decoder</h2>
      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className={mode === 'encode' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => { setMode('encode'); setOutput(''); setError(''); }}>Encode</button>
          <button className={mode === 'decode' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => { setMode('decode'); setOutput(''); setError(''); }}>Decode</button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            rows={4} style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace' }}
            placeholder={mode === 'encode' ? 'https://example.com/?q=hello world' : 'https%3A%2F%2Fexample.com'} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="btn-primary" onClick={process}>{mode === 'encode' ? 'Encode →' : 'Decode →'}</button>
          <button className="btn-secondary" onClick={() => { setInput(''); setOutput(''); setError(''); }}>Clear</button>
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 8 }}>{error}</p>}
        {output && (
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Result</label>
            <textarea readOnly value={output} rows={4} style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace' }} />
            <div style={{ marginTop: 8 }}><CopyButton text={output} /></div>
          </div>
        )}
      </div>
    </div>
  );
}
