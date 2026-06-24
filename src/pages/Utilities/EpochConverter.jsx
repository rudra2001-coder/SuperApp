import { useState } from 'react';
import CopyButton from '../../components/common/CopyButton';

export default function EpochConverter() {
  const [epoch, setEpoch] = useState('');
  const [dateString, setDateString] = useState('');
  const [humanDate, setHumanDate] = useState('');
  const [epochResult, setEpochResult] = useState('');

  const toHuman = () => {
    const ms = parseInt(epoch) * (epoch.length <= 10 ? 1000 : 1);
    const d = new Date(ms);
    if (isNaN(d.getTime())) { setHumanDate('Invalid epoch'); return; }
    setHumanDate(d.toLocaleString() + ' (UTC: ' + d.toUTCString() + ')');
  };

  const toEpoch = () => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) { setEpochResult('Invalid date'); return; }
    setEpochResult(Math.floor(d.getTime() / 1000).toString() + ' (milliseconds: ' + d.getTime() + ')');
  };

  const now = () => {
    const ms = Date.now();
    setEpoch(Math.floor(ms / 1000).toString());
    setHumanDate(new Date().toLocaleString() + ' (UTC: ' + new Date().toUTCString() + ')');
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🕐 Epoch Converter</h2>
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Epoch → Human</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={epoch} onChange={e => setEpoch(e.target.value)}
              placeholder="1700000000" style={{ flex: 1, fontFamily: 'monospace' }} />
            <button className="btn-primary" onClick={toHuman}>Convert</button>
            <button className="btn-secondary" onClick={now}>Now</button>
          </div>
          {humanDate && (
            <div style={{
              padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
              fontFamily: 'monospace', fontSize: 14,
            }}>{humanDate}</div>
          )}
        </div>
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Human → Epoch</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="datetime-local" value={dateString} onChange={e => setDateString(e.target.value)}
              style={{ flex: 1 }} />
            <button className="btn-primary" onClick={toEpoch}>Convert</button>
          </div>
          {epochResult && (
            <div style={{
              padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
              fontFamily: 'monospace', fontSize: 14,
            }}>
              {epochResult}
              <div style={{ marginTop: 8 }}><CopyButton text={epochResult.split(' ')[0]} /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
