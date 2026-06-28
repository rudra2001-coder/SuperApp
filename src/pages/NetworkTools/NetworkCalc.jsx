import { useState } from 'react';
import CopyButton from '../../components/common/CopyButton';

function parseCIDR(cidr) {
  const [ip, bits] = cidr.split('/');
  const prefix = parseInt(bits);
  if (!ip || isNaN(prefix) || prefix < 0 || prefix > 32) return null;

  const octets = ip.split('.').map(Number);
  if (octets.length !== 4 || octets.some(o => isNaN(o) || o < 0 || o > 255)) return null;

  const ipInt = octets.reduce((acc, o) => (acc << 8) + o, 0);
  const mask = ~(2 ** (32 - prefix) - 1);
  const network = ipInt & mask;
  const broadcast = network | ~mask;
  const firstHost = prefix < 31 ? network + 1 : network;
  const lastHost = prefix < 31 ? broadcast - 1 : broadcast;
  const total = 2 ** (32 - prefix);

  const toIP = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

  const maskOctets = [(mask >>> 24) & 255, (mask >>> 16) & 255, (mask >>> 8) & 255, mask & 255];
  const wildcard = maskOctets.map(o => 255 - o);

  const usable = prefix <= 30 ? total - 2 : (prefix === 31 ? total : total);

  return {
    network: toIP(network),
    broadcast: toIP(broadcast),
    firstHost: toIP(firstHost),
    lastHost: toIP(lastHost),
    netmask: maskOctets.join('.'),
    wildcard: wildcard.join('.'),
    prefix,
    total,
    usable,
    cidr: `${toIP(network)}/${prefix}`,
  };
}

function ipToCIDRRange(startIP, endIP) {
  const toInt = (ip) => ip.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0);
  let start = toInt(startIP);
  let end = toInt(endIP);
  if (start > end) [start, end] = [end, start];
  const results = [];
  while (start <= end) {
    let maxSize = 32;
    while (maxSize > 0) {
      const mask = ~(2 ** (32 - (maxSize - 1)) - 1);
      const subnetStart = start & mask;
      if (subnetStart !== start) break;
      maxSize--;
    }
    const size = 32 - maxSize - 1;
    const mask = ~(2 ** size - 1);
    const networkStart = start & mask;
    const rangeEnd = networkStart + (1 << size) - 1;
    results.push(`${[(start >>> 24) & 255, (start >>> 16) & 255, (start >>> 8) & 255, start & 255].join('.')}/${32 - size}`);
    start = rangeEnd + 1;
  }
  return results;
}

export default function NetworkCalc() {
  const [mode, setMode] = useState('cidr');
  const [cidr, setCidr] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const calculate = () => {
    setError(''); setResult(null);

    if (mode === 'cidr') {
      if (!cidr.trim()) { setError('Enter CIDR notation (e.g. 192.168.1.0/24)'); return; }
      const parsed = parseCIDR(cidr.trim());
      if (!parsed) { setError('Invalid CIDR. Use format: 192.168.1.0/24'); return; }
      setResult(parsed);
    } else {
      if (!rangeStart.trim() || !rangeEnd.trim()) { setError('Enter both start and end IP'); return; }
      const cidrs = ipToCIDRRange(rangeStart.trim(), rangeEnd.trim());
      if (cidrs.length === 0) { setError('Invalid IP range'); return; }
      setResult({ cidrs, count: cidrs.length, rangeStart: rangeStart.trim(), rangeEnd: rangeEnd.trim() });
    }
  };

  const Field = ({ label, value, mono }) => (
    <div style={{
      padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: mono ? 'monospace' : 'inherit', color: 'var(--text-primary)' }}>{value || '—'}</span>
    </div>
  );

  const inputStyle = { width: '100%', fontFamily: 'monospace' };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🧮 Network Calculator</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className={mode === 'cidr' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'} onClick={() => { setMode('cidr'); setResult(null); setError(''); }}>CIDR Lookup</button>
          <button className={mode === 'range' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'} onClick={() => { setMode('range'); setResult(null); setError(''); }}>IP Range → CIDR</button>
        </div>

        {mode === 'cidr' ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <input value={cidr} onChange={e => setCidr(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder="192.168.1.0/24" style={inputStyle} />
            </div>
            <button className="btn-primary" onClick={calculate} style={{ height: 40, whiteSpace: 'nowrap' }}>Calculate</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <input value={rangeStart} onChange={e => setRangeStart(e.target.value)}
                placeholder="192.168.1.0" style={inputStyle} />
            </div>
            <span style={{ paddingBottom: 10, color: 'var(--text-secondary)' }}>→</span>
            <div style={{ flex: 1, minWidth: 150 }}>
              <input value={rangeEnd} onChange={e => setRangeEnd(e.target.value)}
                placeholder="192.168.1.255" style={inputStyle} />
            </div>
            <button className="btn-primary" onClick={calculate} style={{ height: 40, whiteSpace: 'nowrap' }}>Convert</button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: 'var(--danger)', color: '#fff', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {result && (
        <>
          {mode === 'cidr' ? (
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div className="card">
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Network Info</h4>
                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <Field label="Network Address" value={result.network} mono />
                  <Field label="Broadcast" value={result.broadcast} mono />
                  <Field label="First Host" value={result.firstHost} mono />
                  <Field label="Last Host" value={result.lastHost} mono />
                </div>
              </div>
              <div className="card">
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Subnet Details</h4>
                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <Field label="Netmask" value={result.netmask} mono />
                  <Field label="Wildcard" value={result.wildcard} mono />
                  <Field label="CIDR Notation" value={result.cidr} mono />
                  <Field label="Prefix Length" value={`/${result.prefix}`} />
                  <Field label="Total Hosts" value={result.total.toLocaleString()} />
                  <Field label="Usable Hosts" value={result.usable.toLocaleString()} />
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600 }}>
                  {result.rangeStart} → {result.rangeEnd} ({result.count} CIDR blocks)
                </h4>
                <CopyButton text={result.cidrs.join('\n')} label="Copy All" />
              </div>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                {result.cidrs.map((c, i) => (
                  <div key={i} style={{
                    padding: '8px 14px', fontSize: 14, fontFamily: 'monospace',
                    borderBottom: i < result.cidrs.length - 1 ? '1px solid var(--border-color)' : 'none',
                    background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                  }}>
                    {c}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
