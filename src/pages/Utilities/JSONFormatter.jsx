import { useState, useMemo } from 'react';
import CopyButton from '../../components/common/CopyButton';

function JSONTree({ data, depth = 0 }) {
  const indent = 16;
  if (data === null) return <span style={{ color: '#ef476f' }}>null</span>;
  if (typeof data === 'undefined') return <span style={{ color: '#999' }}>undefined</span>;
  if (typeof data === 'boolean') return <span style={{ color: '#ffd166' }}>{String(data)}</span>;
  if (typeof data === 'number') return <span style={{ color: '#06d6a0' }}>{data}</span>;
  if (typeof data === 'string') return <span style={{ color: '#118ab2' }}>"{data}"</span>;
  if (Array.isArray(data)) {
    if (data.length === 0) return <span>[]</span>;
    return (
      <div>
        <span>[</span>
        {data.map((item, i) => (
          <div key={i} style={{ paddingLeft: indent }}>
            <JSONTree data={item} depth={depth + 1} />
            {i < data.length - 1 && <span style={{ color: 'var(--text-secondary)' }}>,</span>}
          </div>
        ))}
        <span>]</span>
      </div>
    );
  }
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return <span>{'{}'}</span>;
    return (
      <div>
        <span>{'{'}</span>
        {keys.map((key, i) => (
          <div key={key} style={{ paddingLeft: indent }}>
            <span style={{ color: '#4361ee' }}>"{key}"</span>: <JSONTree data={data[key]} depth={depth + 1} />
            {i < keys.length - 1 && <span style={{ color: 'var(--text-secondary)' }}>,</span>}
          </div>
        ))}
        <span>{'}'}</span>
      </div>
    );
  }
  return <span>{String(data)}</span>;
}

export default function JSONFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indent, setIndent] = useState(2);
  const [viewMode, setViewMode] = useState('formatted');
  const [jsonPath, setJsonPath] = useState('');

  const parsed = useMemo(() => {
    try { return { data: JSON.parse(input), error: null }; }
    catch (e) { return { data: null, error: e.message }; }
  }, [input]);

  const queryResult = useMemo(() => {
    if (!jsonPath.trim() || !parsed.data) return '';
    try {
      const parts = jsonPath.split('.').filter(Boolean);
      let current = parsed.data;
      for (const part of parts) {
        if (current === null || current === undefined) return 'Path not found';
        const arrMatch = part.match(/(\w+)\[(\d+)\]/);
        if (arrMatch) {
          current = current[arrMatch[1]];
          if (Array.isArray(current)) current = current[parseInt(arrMatch[2])];
        } else {
          current = current[part];
        }
      }
      return current !== undefined ? JSON.stringify(current, null, 2) : 'Path not found';
    } catch {
      return 'Invalid path';
    }
  }, [jsonPath, parsed.data]);

  const formatJSON = () => {
    setError('');
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent));
      setViewMode('formatted');
    } catch (e) {
      setError(e.message);
      setOutput('');
    }
  };

  const minifyJSON = () => {
    setError('');
    try {
      setOutput(JSON.stringify(JSON.parse(input)));
      setViewMode('formatted');
    } catch (e) {
      setError(e.message);
      setOutput('');
    }
  };

  const validateJSON = () => {
    setError('');
    try {
      JSON.parse(input);
      setOutput('✓ Valid JSON');
    } catch (e) {
      setError(e.message);
      setOutput('');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>📋 JSON Formatter & Validator</h2>
      <div className="grid-2">
        <div className="card">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            rows={15} style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
            placeholder='{"key": "value"}' />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={formatJSON}>Format</button>
            <button className="btn-secondary" onClick={minifyJSON}>Minify</button>
            <button className="btn-secondary" onClick={validateJSON}>Validate</button>
            <button className="btn-secondary" onClick={() => { setInput(''); setOutput(''); setError(''); }}>Clear</button>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Indent:</span>
            <select value={indent} onChange={e => setIndent(Number(e.target.value))}>
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
            </select>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>View:</span>
            <select value={viewMode} onChange={e => setViewMode(e.target.value)}>
              <option value="formatted">Formatted</option>
              <option value="tree">Tree</option>
            </select>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              JSON Path Query (e.g. data.items[0].name)
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              <input value={jsonPath} onChange={e => setJsonPath(e.target.value)}
                style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }} placeholder="key.subkey[0]" />
            </div>
            {queryResult && (
              <div style={{ marginTop: 4, padding: 8, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap' }}>
                {queryResult}
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Output</label>
            {output && output !== '✓ Valid JSON' && <CopyButton text={output} />}
          </div>
          {error ? (
            <div style={{ padding: 16, background: '#fde0e6', color: '#c23350', borderRadius: 'var(--radius)', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              ⚠️ {error}
            </div>
          ) : output === '✓ Valid JSON' ? (
            <div style={{ padding: 16, background: '#d4f5e9', color: '#0b8a6a', borderRadius: 'var(--radius)', fontSize: 16, fontWeight: 600, textAlign: 'center' }}>
              ✓ Valid JSON
            </div>
          ) : viewMode === 'tree' && parsed.data ? (
            <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, overflow: 'auto', maxHeight: 400 }}>
              <JSONTree data={parsed.data} />
            </div>
          ) : (
            <textarea readOnly value={output} rows={15} style={{
              width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: 13,
            }} />
          )}
          {parsed.data && !error && (
            <div style={{ marginTop: 12, padding: 8, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', fontSize: 13, display: 'flex', gap: 16 }}>
              <span>Keys: <strong>{Object.keys(parsed.data).length}</strong></span>
              <span>Type: <strong>{Array.isArray(parsed.data) ? 'Array' : typeof parsed.data}</strong></span>
              {typeof parsed.data === 'string' && <span>Length: <strong>{parsed.data.length}</strong></span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
