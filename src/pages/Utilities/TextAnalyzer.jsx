import { useState, useMemo } from 'react';
import CopyButton from '../../components/common/CopyButton';

export default function TextAnalyzer() {
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0;
    const lines = text ? text.split('\n').length : 0;
    const paragraphs = text ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
    const spaces = (text.match(/\s/g) || []).length;
    const digits = (text.match(/\d/g) || []).length;
    const letters = (text.match(/[a-zA-Z]/g) || []).length;
    const punctuation = (text.match(/[^\w\s]/g) || []).length;

    const wordFreq = {};
    text.toLowerCase().match(/\b\w+\b/g)?.forEach(w => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    });
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const charFreq = {};
    for (const c of text.toLowerCase()) {
      if (c.match(/[a-z]/)) {
        charFreq[c] = (charFreq[c] || 0) + 1;
      }
    }
    const topChars = Object.entries(charFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return { chars, charsNoSpace, words, sentences, lines, paragraphs, spaces, digits, letters, punctuation, topWords, topChars };
  }, [text]);

  const StatCard = ({ label, value }) => (
    <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
      <p style={{ fontSize: 24, fontWeight: 700 }}>{value}</p>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</p>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>📊 Text Analyzer</h2>
      <div className="grid-2">
        <div className="card">
          <textarea value={text} onChange={e => setText(e.target.value)}
            rows={15} style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: 14 }}
            placeholder="Paste or type text here to analyze..." />
          {text && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <CopyButton text={text} />
              <button className="btn-secondary btn-sm" onClick={() => setText('')}>Clear</button>
            </div>
          )}
        </div>
        <div>
          <div className="grid-3" style={{ marginBottom: 12 }}>
            <StatCard label="Characters" value={stats.chars} />
            <StatCard label="No Spaces" value={stats.charsNoSpace} />
            <StatCard label="Words" value={stats.words} />
            <StatCard label="Sentences" value={stats.sentences} />
            <StatCard label="Lines" value={stats.lines} />
            <StatCard label="Paragraphs" value={stats.paragraphs} />
            <StatCard label="Letters" value={stats.letters} />
            <StatCard label="Digits" value={stats.digits} />
            <StatCard label="Punctuation" value={stats.punctuation} />
            <StatCard label="Spaces" value={stats.spaces} />
          </div>
          {stats.topWords.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Top Words</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {stats.topWords.map(([word, freq]) => (
                  <span key={word} style={{
                    padding: '4px 10px', background: 'var(--bg-secondary)',
                    borderRadius: 12, fontSize: 13,
                  }}>{word} <strong>{freq}</strong></span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
