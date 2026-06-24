import { useState } from 'react';
import CopyButton from '../../components/common/CopyButton';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export default function UUIDGenerator() {
  const [uuids, setUuids] = useState([generateUUID()]);
  const [count, setCount] = useState(1);

  const generate = () => {
    const newUuids = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(generateUUID());
    }
    setUuids(newUuids);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🆔 UUID Generator</h2>
      <div className="card">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16 }}>
          <div style={{ width: 120 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Count</label>
            <input type="number" min={1} max={100} value={count} onChange={e => setCount(Number(e.target.value))} />
          </div>
          <button className="btn-primary" onClick={generate}>🔄 Generate</button>
          <button className="btn-secondary" onClick={copyAll}>📋 Copy All</button>
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {uuids.map((uuid, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 12px', background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius)', marginBottom: 6,
              fontFamily: 'monospace', fontSize: 14,
            }}>
              <span>{uuid}</span>
              <CopyButton text={uuid} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
