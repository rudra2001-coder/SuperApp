import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import CopyButton from '../../components/common/CopyButton';

const PRESETS = [
  { label: 'Small (128)', size: 128 },
  { label: 'Medium (256)', size: 256 },
  { label: 'Large (512)', size: 512 },
  { label: 'XL (1024)', size: 1024 },
];

export default function QRGenerator() {
  const [text, setText] = useState('');
  const [fgColor, setFgColor] = useState('#4361ee');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(256);
  const [show, setShow] = useState(false);
  const [includeMargin, setIncludeMargin] = useState(true);
  const canvasRef = useRef(null);

  const generate = () => { if (text.trim()) setShow(true); };

  const downloadQR = (format) => {
    const svg = document.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    if (format === 'svg') {
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'qrcode.svg';
      a.click(); URL.revokeObjectURL(url);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      img.onload = () => {
        ctx.fillStyle = bgColor; ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url; a.download = 'qrcode.png';
        a.click(); URL.revokeObjectURL(url);
      };
      img.src = URL.createObjectURL(blob);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>📱 QR Code Generator</h2>
      <div className="grid-2">
        <div className="card">
          <div style={{ marginBottom: 12 }}>
            <textarea value={text} onChange={e => { setText(e.target.value); setShow(false); }}
              rows={3} style={{ width: '100%', resize: 'vertical' }} placeholder="https://example.com or any text..." />
          </div>
          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Foreground</label>
              <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} style={{ width: '100%', height: 40 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Background</label>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: '100%', height: 40 }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Size</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {PRESETS.map(p => (
                <button key={p.size} className={size === p.size ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                  onClick={() => setSize(p.size)}>{p.label}</button>
              ))}
            </div>
            <input type="range" min={64} max={1024} value={size} onChange={e => setSize(Number(e.target.value))}
              style={{ width: '100%', marginTop: 8 }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={includeMargin} onChange={() => setIncludeMargin(!includeMargin)}
              style={{ accentColor: 'var(--accent)' }} />
            Include margin
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={generate}>Generate</button>
            {show && (
              <>
                <button className="btn-secondary" onClick={() => downloadQR('png')}>⬇ PNG</button>
                <button className="btn-secondary" onClick={() => downloadQR('svg')}>⬇ SVG</button>
              </>
            )}
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          {show ? (
            <>
              <QRCodeSVG value={text} size={size} fgColor={fgColor} bgColor={bgColor} includeMargin={includeMargin} />
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <CopyButton text={text} />
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Enter text and click Generate</p>
          )}
        </div>
      </div>
    </div>
  );
}
