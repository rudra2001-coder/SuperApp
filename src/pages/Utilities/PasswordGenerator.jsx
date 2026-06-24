import { useState } from 'react';
import CopyButton from '../../components/common/CopyButton';

function generatePassword(length, useUpper, useLower, useDigits, useSymbols) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  let chars = '';
  if (useUpper) chars += upper;
  if (useLower) chars += lower;
  if (useDigits) chars += digits;
  if (useSymbols) chars += symbols;
  if (!chars) return '';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);

  const generate = () => {
    const pwd = generatePassword(length, useUpper, useLower, useDigits, useSymbols);
    setPassword(pwd);
    let score = 0;
    if (length >= 8) score += 25;
    if (length >= 12) score += 25;
    if (useUpper && useLower) score += 15;
    if (useDigits) score += 10;
    if (useSymbols) score += 15;
    if (length >= 16) score += 10;
    setStrength(Math.min(100, score));
  };

  const getStrengthColor = () => {
    if (strength < 30) return 'var(--danger)';
    if (strength < 60) return 'var(--warning)';
    return 'var(--success)';
  };

  const getStrengthLabel = () => {
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Medium';
    if (strength < 80) return 'Strong';
    return 'Very Strong';
  };

  const checkbox = (label, checked, onChange) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
      <input type="checkbox" checked={checked} onChange={onChange}
        style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
      {label}
    </label>
  );

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🔑 Password Generator</h2>
      <div className="grid-2">
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Length: {length}</label>
            <input type="range" min={4} max={64} value={length} onChange={e => setLength(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {checkbox('Uppercase (A-Z)', useUpper, () => setUseUpper(!useUpper))}
            {checkbox('Lowercase (a-z)', useLower, () => setUseLower(!useLower))}
            {checkbox('Digits (0-9)', useDigits, () => setUseDigits(!useDigits))}
            {checkbox('Symbols (!@#$)', useSymbols, () => setUseSymbols(!useSymbols))}
          </div>
          <button className="btn-primary" onClick={generate}>🔀 Generate</button>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {password ? (
            <>
              <div style={{
                padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
                fontFamily: 'monospace', fontSize: 18, textAlign: 'center', wordBreak: 'break-all',
                marginBottom: 12,
              }}>{password}</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Strength</span>
                  <span style={{ fontWeight: 600, color: getStrengthColor() }}>{getStrengthLabel()}</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${strength}%`, height: '100%', background: getStrengthColor(), borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
              <CopyButton text={password} />
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Configure options and click Generate</p>
          )}
        </div>
      </div>
    </div>
  );
}
