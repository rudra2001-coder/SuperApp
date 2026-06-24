import { useState, useEffect, useRef } from 'react';

export default function Timer() {
  const [mode, setMode] = useState('stopwatch');
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [countdownInput, setCountdownInput] = useState('300');
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const startStop = () => {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      if (mode === 'countdown' && time <= 0) {
        setTime(parseInt(countdownInput) || 0);
      }
      setRunning(true);
      const start = Date.now() - time * 1000;
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        if (mode === 'countdown') {
          const remaining = (parseInt(countdownInput) || 0) - elapsed;
          setTime(Math.max(0, remaining));
          if (remaining <= 0) {
            clearInterval(intervalRef.current);
            setRunning(false);
          }
        } else {
          setTime(elapsed);
        }
      }, 50);
    }
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setTime(0);
    setLaps([]);
  };

  const lap = () => {
    if (mode === 'stopwatch') {
      setLaps(prev => [...prev, time]);
    }
  };

  const formatTime = (t) => {
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
  };

  const displayTime = mode === 'countdown' && !running && time === 0 ? parseInt(countdownInput) || 0 : time;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>⏱️ Timer & Stopwatch</h2>
      <div className="grid-2">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            <button className={mode === 'stopwatch' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => { reset(); setMode('stopwatch'); }}>Stopwatch</button>
            <button className={mode === 'countdown' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => { reset(); setMode('countdown'); }}>Countdown</button>
          </div>
          {mode === 'countdown' && !running && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Seconds</label>
              <input type="number" value={countdownInput} onChange={e => setCountdownInput(e.target.value)}
                style={{ width: 120, textAlign: 'center', fontSize: 18 }} min={1} />
            </div>
          )}
          <div style={{
            fontSize: 48, fontWeight: 700, fontFamily: 'monospace',
            marginBottom: 24, letterSpacing: 2,
            color: mode === 'countdown' && time < 10 ? 'var(--danger)' : 'var(--text-primary)',
          }}>
            {formatTime(displayTime)}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn-primary" style={{ padding: '12px 32px', fontSize: 16 }} onClick={startStop}>
              {running ? '⏸ Pause' : (time > 0 ? '▶ Resume' : '▶ Start')}
            </button>
            {mode === 'stopwatch' && running && (
              <button className="btn-secondary" style={{ padding: '12px 24px' }} onClick={lap}>⏱️ Lap</button>
            )}
            <button className="btn-secondary" style={{ padding: '12px 24px' }} onClick={reset}>↺ Reset</button>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Laps</h3>
          {laps.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
              {mode === 'stopwatch' ? 'Press Lap to record a split time' : 'Laps only available in Stopwatch mode'}
            </p>
          ) : (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Lap</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Time</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Split</th>
                  </tr>
                </thead>
                <tbody>
                  {laps.map((lapTime, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{formatTime(lapTime)}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        {i === 0 ? formatTime(lapTime) : formatTime(lapTime - laps[i - 1])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
