import { useState } from 'react';
import CopyButton from '../../components/common/CopyButton';

const cases = [
  { id: 'upper', label: 'UPPER CASE', fn: s => s.toUpperCase() },
  { id: 'lower', label: 'lower case', fn: s => s.toLowerCase() },
  { id: 'title', label: 'Title Case', fn: s => s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) },
  { id: 'sentence', label: 'Sentence case', fn: s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() },
  { id: 'camel', label: 'camelCase', fn: s => s.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, c => c.toLowerCase()) },
  { id: 'pascal', label: 'PascalCase', fn: s => s.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, c => c.toUpperCase()) },
  { id: 'snake', label: 'snake_case', fn: s => s.replace(/\s+/g, '_').replace(/-/g, '_').toLowerCase() },
  { id: 'kebab', label: 'kebab-case', fn: s => s.replace(/\s+/g, '-').replace(/_/g, '-').toLowerCase() },
  { id: 'alternating', label: 'aLtErNaTiNg', fn: s => s.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('') },
  { id: 'inverse', label: 'iNVERSE cASE', fn: s => s.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('') },
];

export default function TextCaseConverter() {
  const [input, setInput] = useState('');
  const [activeCase, setActiveCase] = useState('upper');
  const [output, setOutput] = useState('');

  const convert = (caseId) => {
    setActiveCase(caseId);
    if (!input) return;
    const c = cases.find(c => c.id === caseId);
    if (c) setOutput(c.fn(input));
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🔤 Text Case Converter</h2>
      <div className="grid-2">
        <div className="card">
          <textarea value={input} onChange={e => { setInput(e.target.value); if (e.target.value) convert(activeCase); else setOutput(''); }}
            rows={10} style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: 14 }}
            placeholder="Enter text to convert..." />
        </div>
        <div className="card">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {cases.map(c => (
              <button key={c.id}
                onClick={() => convert(c.id)}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius)', fontSize: 12,
                  background: activeCase === c.id ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: activeCase === c.id ? '#fff' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)', cursor: 'pointer',
                }}>{c.label}</button>
            ))}
          </div>
          {output ? (
            <>
              <textarea readOnly value={output} rows={8}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: 14 }} />
              <div style={{ marginTop: 8 }}><CopyButton text={output} /></div>
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Enter text and select a case</p>
          )}
        </div>
      </div>
    </div>
  );
}
