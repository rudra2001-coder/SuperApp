import { useState, useMemo } from 'react';
import CopyButton from '../../components/common/CopyButton';

export default function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('gm');
  const [testText, setTestText] = useState('');
  const [replacement, setReplacement] = useState('');
  const [replaceResult, setReplaceResult] = useState('');

  const regex = useMemo(() => {
    try {
      return new RegExp(pattern, flags);
    } catch {
      return null;
    }
  }, [pattern, flags]);

  const matches = useMemo(() => {
    if (!regex || !testText) return [];
    const results = [];
    let match;
    const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
    while ((match = re.exec(testText)) !== null) {
      results.push({
        index: match.index,
        value: match[0],
        length: match[0].length,
      });
      if (match.index === re.lastIndex) re.lastIndex++;
    }
    return results;
  }, [regex, testText]);

  const doReplace = () => {
    if (!regex) return;
    try {
      setReplaceResult(testText.replace(regex, replacement));
    } catch {
      setReplaceResult('Replace failed');
    }
  };

  const isValid = regex !== null;

  const getHighlightedText = () => {
    if (!regex || !testText) return testText;
    const parts = [];
    let lastIndex = 0;
    const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
    let match;
    while ((match = re.exec(testText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: testText.slice(lastIndex, match.index), highlight: false });
      }
      parts.push({ text: match[0], highlight: true });
      lastIndex = match.index + match[0].length;
      if (match.index === re.lastIndex) re.lastIndex++;
    }
    if (lastIndex < testText.length) {
      parts.push({ text: testText.slice(lastIndex), highlight: false });
    }
    return parts;
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🔍 Regex Tester</h2>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Pattern</label>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>/</span>
              <input value={pattern} onChange={e => setPattern(e.target.value)}
                style={{ flex: 1, fontFamily: 'monospace' }} placeholder="\d+" />
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>/</span>
              <input value={flags} onChange={e => setFlags(e.target.value)}
                style={{ width: 80, fontFamily: 'monospace' }} placeholder="gm" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{
              width: 12, height: 12, borderRadius: '50%',
              background: isValid ? 'var(--success)' : 'var(--danger)',
              display: 'inline-block',
            }} />
            <span style={{ fontSize: 13, color: isValid ? 'var(--success)' : 'var(--danger)' }}>
              {isValid ? 'Valid' : 'Invalid regex'}
            </span>
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Test String</label>
          <textarea value={testText} onChange={e => setTestText(e.target.value)}
            rows={12} style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
            placeholder="Enter text to test against..." />
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            Matches: {matches.length}
          </h3>
          <div style={{
            padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
            fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            minHeight: 100, maxHeight: 200, overflow: 'auto', marginBottom: 12,
          }}>
            {testText ? (
              getHighlightedText().map((part, i) => (
                <span key={i} style={{
                  background: part.highlight ? 'rgba(67, 97, 238, 0.3)' : 'transparent',
                  borderBottom: part.highlight ? '2px solid var(--accent)' : 'none',
                  borderRadius: part.highlight ? 2 : 0,
                }}>{part.text}</span>
              ))
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>Enter text to see matches highlighted</span>
            )}
          </div>
          {matches.length > 0 && (
            <div style={{ maxHeight: 150, overflowY: 'auto', marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>Match</th>
                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>Position</th>
                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>Copy</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '4px 8px' }}>{i + 1}</td>
                      <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{m.value}</td>
                      <td style={{ padding: '4px 8px', color: 'var(--text-secondary)' }}>{m.index}</td>
                      <td style={{ padding: '4px 8px' }}><CopyButton text={m.value} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>Replace with</label>
              <input value={replacement} onChange={e => setReplacement(e.target.value)}
                style={{ width: '100%', fontFamily: 'monospace' }} placeholder="$1" />
            </div>
            <button className="btn-secondary btn-sm" onClick={doReplace}>Replace</button>
          </div>
          {replaceResult && (
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>Result</label>
              <textarea readOnly value={replaceResult} rows={4}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
