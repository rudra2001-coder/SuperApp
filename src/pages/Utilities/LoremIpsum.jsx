import { useState } from 'react';
import CopyButton from '../../components/common/CopyButton';

const WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur',
  'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui',
  'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
];

function generateWords(count) {
  let result = [];
  for (let i = 0; i < count; i++) {
    result.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return result.join(' ');
}

function generateSentences(count) {
  const sentences = [];
  for (let i = 0; i < count; i++) {
    const wordCount = 5 + Math.floor(Math.random() * 15);
    const words = generateWords(wordCount);
    sentences.push(words.charAt(0).toUpperCase() + words.slice(1) + '.');
  }
  return sentences.join(' ');
}

function generateParagraphs(count) {
  const paragraphs = [];
  for (let i = 0; i < count; i++) {
    const sentenceCount = 3 + Math.floor(Math.random() * 7);
    const text = generateSentences(sentenceCount);
    paragraphs.push(text);
  }
  return paragraphs.join('\n\n');
}

export default function LoremIpsum() {
  const [count, setCount] = useState(3);
  const [mode, setMode] = useState('paragraphs');
  const [output, setOutput] = useState('');

  const generate = () => {
    switch (mode) {
      case 'words': setOutput(generateWords(count)); break;
      case 'sentences': setOutput(generateSentences(count)); break;
      case 'paragraphs': setOutput(generateParagraphs(count)); break;
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>📝 Lorem Ipsum Generator</h2>
      <div className="card">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ width: 160 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Type</label>
            <select value={mode} onChange={e => setMode(e.target.value)} style={{ width: '100%' }}>
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
            </select>
          </div>
          <div style={{ width: 120 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Count</label>
            <input type="number" min={1} max={100} value={count} onChange={e => setCount(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <button className="btn-primary" onClick={generate}>Generate</button>
          {output && <CopyButton text={output} />}
        </div>
        <textarea readOnly value={output} rows={15}
          style={{ width: '100%', resize: 'vertical', fontFamily: 'serif', fontSize: 14, lineHeight: 1.6 }} />
      </div>
    </div>
  );
}
