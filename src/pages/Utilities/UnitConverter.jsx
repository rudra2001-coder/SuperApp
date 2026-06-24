import { useState } from 'react';

const categories = {
  length: {
    label: 'Length',
    units: [
      { id: 'mm', label: 'Millimeter', toBase: v => v, fromBase: v => v },
      { id: 'cm', label: 'Centimeter', toBase: v => v * 10, fromBase: v => v / 10 },
      { id: 'm', label: 'Meter', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { id: 'km', label: 'Kilometer', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
      { id: 'in', label: 'Inch', toBase: v => v * 25.4, fromBase: v => v / 25.4 },
      { id: 'ft', label: 'Foot', toBase: v => v * 304.8, fromBase: v => v / 304.8 },
      { id: 'yd', label: 'Yard', toBase: v => v * 914.4, fromBase: v => v / 914.4 },
      { id: 'mi', label: 'Mile', toBase: v => v * 1.609e6, fromBase: v => v / 1.609e6 },
    ],
  },
  weight: {
    label: 'Weight',
    units: [
      { id: 'mg', label: 'Milligram', toBase: v => v, fromBase: v => v },
      { id: 'g', label: 'Gram', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { id: 'kg', label: 'Kilogram', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
      { id: 'oz', label: 'Ounce', toBase: v => v * 28349.5, fromBase: v => v / 28349.5 },
      { id: 'lb', label: 'Pound', toBase: v => v * 453592, fromBase: v => v / 453592 },
    ],
  },
  temperature: {
    label: 'Temperature',
    units: [
      { id: 'c', label: 'Celsius', toBase: v => v, fromBase: v => v },
      { id: 'f', label: 'Fahrenheit', toBase: v => (v - 32) * 5 / 9, fromBase: v => v * 9 / 5 + 32 },
      { id: 'k', label: 'Kelvin', toBase: v => v - 273.15, fromBase: v => v + 273.15 },
    ],
  },
  data: {
    label: 'Data Size',
    units: [
      { id: 'b', label: 'Byte', toBase: v => v, fromBase: v => v },
      { id: 'kb', label: 'Kilobyte', toBase: v => v * 1024, fromBase: v => v / 1024 },
      { id: 'mb', label: 'Megabyte', toBase: v => v * 1024 * 1024, fromBase: v => v / (1024 * 1024) },
      { id: 'gb', label: 'Gigabyte', toBase: v => v * 1024 * 1024 * 1024, fromBase: v => v / (1024 * 1024 * 1024) },
      { id: 'tb', label: 'Terabyte', toBase: v => v * 1024 * 1024 * 1024 * 1024, fromBase: v => v / (1024 * 1024 * 1024 * 1024) },
    ],
  },
};

export default function UnitConverter() {
  const [category, setCategory] = useState('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');
  const [value, setValue] = useState('');
  const [result, setResult] = useState('');

  const cat = categories[category];

  const convert = () => {
    const val = parseFloat(value);
    if (isNaN(val)) { setResult(''); return; }
    const from = cat.units.find(u => u.id === fromUnit);
    const to = cat.units.find(u => u.id === toUnit);
    if (!from || !to) return;
    const base = from.toBase(val);
    const converted = to.fromBase(base);
    setResult(converted.toFixed(6).replace(/\.?0+$/, ''));
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>📏 Unit Converter</h2>
      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {Object.entries(categories).map(([key, c]) => (
            <button key={key}
              onClick={() => { setCategory(key); const u = c.units[0]; setFromUnit(u.id); setToUnit(c.units[1]?.id || u.id); setResult(''); }}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius)',
                background: category === key ? 'var(--accent)' : 'var(--bg-secondary)',
                color: category === key ? '#fff' : 'var(--text-primary)',
                border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 500,
              }}>{c.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Value</label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)} style={{ width: '100%' }} placeholder="0" />
          </div>
          <div style={{ width: 140 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>From</label>
            <select value={fromUnit} onChange={e => setFromUnit(e.target.value)} style={{ width: '100%' }}>
              {cat.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 24, color: 'var(--text-secondary)', paddingBottom: 8 }}>→</div>
          <div style={{ width: 140 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>To</label>
            <select value={toUnit} onChange={e => setToUnit(e.target.value)} style={{ width: '100%' }}>
              {cat.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={convert} style={{ height: 40 }}>Convert</button>
        </div>
        {result !== '' && (
          <div style={{
            marginTop: 16, padding: 16, background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius)', textAlign: 'center', fontSize: 24, fontWeight: 600,
          }}>
            {value} {cat.units.find(u => u.id === fromUnit)?.label} = {result} {cat.units.find(u => u.id === toUnit)?.label}
          </div>
        )}
      </div>
    </div>
  );
}
