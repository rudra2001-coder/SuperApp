import { useState, useMemo } from 'react';
import CopyButton from '../../components/common/CopyButton';

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function getContrastRatio(hex1, hex2) {
  const luminance = (hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function generatePalette(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];
  const colors = [];
  for (let i = 0; i < 9; i++) {
    const factor = 0.1 + i * 0.1;
    const r = Math.round(rgb.r * factor + 255 * (1 - factor));
    const g = Math.round(rgb.g * factor + 255 * (1 - factor));
    const b = Math.round(rgb.b * factor + 255 * (1 - factor));
    colors.push(rgbToHex(r, g, b));
  }
  return colors;
}

export default function ColorConverter() {
  const [hex, setHex] = useState('#4361ee');
  const [rgb, setRgb] = useState({ r: 67, g: 97, b: 238 });
  const [hsl, setHsl] = useState({ h: 229, s: 83, l: 60 });
  const [fgContrast, setFgContrast] = useState('#ffffff');
  const [showPalette, setShowPalette] = useState(false);

  const updateFromHex = (value) => {
    setHex(value);
    const rgbVal = hexToRgb(value);
    if (rgbVal) { setRgb(rgbVal); setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b)); }
  };

  const updateFromRgb = (r, g, b) => {
    const rgbVal = { r: Math.min(255, Math.max(0, r || 0)), g: Math.min(255, Math.max(0, g || 0)), b: Math.min(255, Math.max(0, b || 0)) };
    setRgb(rgbVal); setHex(rgbToHex(rgbVal.r, rgbVal.g, rgbVal.b)); setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
  };

  const updateFromHsl = (h, s, l) => {
    const hslVal = { h: Math.min(360, Math.max(0, h || 0)), s: Math.min(100, Math.max(0, s || 0)), l: Math.min(100, Math.max(0, l || 0)) };
    setHsl(hslVal);
    const rgbVal = hslToRgb(hslVal.h, hslVal.s, hslVal.l);
    setRgb(rgbVal); setHex(rgbToHex(rgbVal.r, rgbVal.g, rgbVal.b));
  };

  const contrastRatio = useMemo(() => getContrastRatio(hex, fgContrast), [hex, fgContrast]);
  const palette = useMemo(() => generatePalette(hex), [hex]);
  const meetsAA = contrastRatio >= 4.5;
  const meetsAAA = contrastRatio >= 7;

  const inputRow = (label, val, onChange, max = 255) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ width: 20, fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      <input type="number" min={0} max={max} value={val}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: 70, textAlign: 'center' }} />
      <input type="range" min={0} max={max} value={val}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1 }} />
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🎨 Color Converter & WCAG Contrast</h2>
      <div className="grid-2">
        <div className="card">
          <div style={{
            width: '100%', height: 80, borderRadius: 'var(--radius)',
            backgroundColor: hex, border: '1px solid var(--border-color)',
            marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{hex}</span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>HEX</label>
              <input type="color" value={hex} onChange={e => updateFromHex(e.target.value)}
                style={{ width: 32, height: 32, padding: 0, border: 'none', cursor: 'pointer' }} />
              <CopyButton text={hex} />
            </div>
            <input value={hex} onChange={e => updateFromHex(e.target.value)}
              style={{ width: '100%', fontFamily: 'monospace' }} placeholder="#000000" />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>RGB</label>
            {inputRow('R', rgb.r, (v) => updateFromRgb(v, rgb.g, rgb.b))}
            {inputRow('G', rgb.g, (v) => updateFromRgb(rgb.r, v, rgb.b))}
            {inputRow('B', rgb.b, (v) => updateFromRgb(rgb.r, rgb.g, v))}
            <CopyButton text={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>HSL</label>
            {inputRow('H', hsl.h, (v) => updateFromHsl(v, hsl.s, hsl.l), 360)}
            {inputRow('S', hsl.s, (v) => updateFromHsl(hsl.h, v, hsl.l), 100)}
            {inputRow('L', hsl.l, (v) => updateFromHsl(hsl.h, hsl.s, v), 100)}
            <CopyButton text={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} />
          </div>

          <button className="btn-secondary" onClick={() => setShowPalette(!showPalette)}>
            🎨 {showPalette ? 'Hide' : 'Show'} Palette
          </button>
          {showPalette && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {palette.map((c, i) => (
                  <div key={i} style={{
                    flex: 1, height: 40, backgroundColor: c, borderRadius: 4,
                    cursor: 'pointer', border: '1px solid var(--border-color)',
                  }} onClick={() => updateFromHex(c)} title={c} />
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Click a shade to use it</p>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Color Preview</h3>
            <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>🎨</div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 600 }}>{hex}</p>
              <p style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>rgb({rgb.r}, {rgb.g}, {rgb.b})</p>
              <p style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</p>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff', '#4361ee', '#ef476f', '#06d6a0', '#ffd166'].map(c => (
                <div key={c} style={{
                  width: 24, height: 24, borderRadius: '50%', backgroundColor: c,
                  cursor: 'pointer', border: '2px solid var(--border-color)',
                }} onClick={() => updateFromHex(c)} />
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>WCAG Contrast Check</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', backgroundColor: hex, border: '1px solid var(--border-color)' }} />
              <span style={{ fontSize: 18 }}>vs</span>
              <input type="color" value={fgContrast} onChange={e => setFgContrast(e.target.value)}
                style={{ width: 40, height: 40, padding: 0, border: 'none', cursor: 'pointer' }} />
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', backgroundColor: fgContrast, border: '1px solid var(--border-color)' }} />
            </div>
            <div style={{
              padding: 16, borderRadius: 'var(--radius)', textAlign: 'center',
              backgroundColor: hex, color: fgContrast,
              fontSize: 18, fontWeight: 700, marginBottom: 12,
            }}>
              Sample Text on This Background
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Contrast Ratio</span>
                <strong>{contrastRatio.toFixed(2)}:1</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>WCAG AA (4.5:1)</span>
                <span style={{ color: meetsAA ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {meetsAA ? '✓ Pass' : '✕ Fail'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>WCAG AAA (7:1)</span>
                <span style={{ color: meetsAAA ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {meetsAAA ? '✓ Pass' : '✕ Fail'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
