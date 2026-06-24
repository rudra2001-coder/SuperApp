import { useState } from 'react';
import { snmpCheck } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import CopyButton from '../../components/common/CopyButton';

const PHASES = [
  { key: 'ping', label: 'Host Reachability', icon: '📶' },
  { key: 'snmp', label: 'SNMP Connection', icon: '🔌' },
];

export default function SNMPChecker() {
  const [form, setForm] = useState({ host: '', community: 'public', port: '161', version: '2c' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const check = async () => {
    if (!form.host.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await snmpCheck({
        host: form.host.trim(),
        community: form.community.trim(),
        port: parseInt(form.port) || 161,
        version: form.version,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'SNMP check failed');
    }
    setLoading(false);
  };

  const formatUptime = (sec) => {
    const s = parseInt(sec);
    if (isNaN(s)) return sec;
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const formatSpeed = (bps) => {
    const n = parseInt(bps);
    if (isNaN(n) || n === 0) return '—';
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)} Gbps`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(0)} Mbps`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)} Kbps`;
    return `${n} bps`;
  };

  const Field = ({ label, value }) => (
    <div style={{
      padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{value || '—'}</span>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>📡 SNMP Checker</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Check if SNMP is enabled on a device and retrieve system information
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 180 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>IP / Host</label>
            <input value={form.host} onChange={e => setForm({ ...form, host: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && check()}
              placeholder="192.168.88.1" style={{ width: '100%' }} />
          </div>
          <div style={{ width: 140 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Community</label>
            <input value={form.community} onChange={e => setForm({ ...form, community: e.target.value })}
              placeholder="public" style={{ width: '100%' }} />
          </div>
          <div style={{ width: 80 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Port</label>
            <input value={form.port} onChange={e => setForm({ ...form, port: e.target.value })}
              placeholder="161" style={{ width: '100%' }} />
          </div>
          <div style={{ width: 90 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Version</label>
            <select value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} style={{ width: '100%' }}>
              <option value="1">v1</option>
              <option value="2c">v2c</option>
            </select>
          </div>
          <button className="btn-primary" onClick={check} disabled={loading} style={{ height: 40, alignSelf: 'flex-end' }}>
            {loading ? '⏳' : '📡 Check SNMP'}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {loading && <LoadingSpinner text="Testing SNMP..." />}

      {result && !loading && (
        <>
          {/* Diagnostics */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📋 Diagnostic Steps</h3>
            {PHASES.map(phase => {
              const diag = result.diagnostics?.find(d => d.phase === phase.key);
              const isPass = diag?.status === 'pass';
              const isPending = !diag;
              return (
                <div key={phase.key} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
                  borderBottom: '1px solid var(--border-color)', opacity: isPending ? 0.4 : 1,
                }}>
                  <span style={{ fontSize: 18, marginTop: 1 }}>{isPending ? '⏳' : isPass ? '✅' : '❌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{phase.icon} {phase.label}</div>
                    {diag && (
                      <>
                        <div style={{ fontSize: 12, color: isPass ? 'var(--success)' : 'var(--danger)', marginTop: 2 }}>
                          {diag.message}
                        </div>
                        {diag.detail && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {diag.detail}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {result.success ? (
            <>
              {/* System Info */}
              <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--success)' }}>
                  ✅ {result.message}
                </h3>
                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🖥️ System Info</h4>
                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <Field label="System Name" value={result.system.name} />
                  <Field label="Description" value={result.system.description} />
                  <Field label="Location" value={result.system.location} />
                  <Field label="Contact" value={result.system.contact} />
                  <Field label="Object ID" value={result.system.objectId} />
                  <Field label="Uptime" value={formatUptime(result.system.uptime)} />
                  <Field label="Interface Count" value={result.system.ifCount} />
                </div>
              </div>

              {/* Interfaces */}
              {result.interfaces?.length > 0 && (
                <div className="card" style={{ marginBottom: 24 }}>
                  <div style={{
                    display: 'flex', gap: 6, marginBottom: 12,
                  }}>
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: 'var(--success)22', color: 'var(--success)', fontWeight: 600 }}>
                      {result.interfaces.filter(i => i.oper === 'up').length} Link Up
                    </span>
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: 'var(--danger)22', color: 'var(--danger)', fontWeight: 600 }}>
                      {result.interfaces.filter(i => i.oper === 'down').length} Link Down
                    </span>
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: 'var(--accent)22', color: 'var(--accent)', fontWeight: 600 }}>
                      {result.interfaces.length} Total
                    </span>
                  </div>
                  <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    {result.interfaces.map((iface, i) => {
                      const isUp = iface.oper === 'up';
                      const adminDown = iface.admin === 'down';
                      return (
                        <div key={i} style={{
                          padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12,
                          borderBottom: i < result.interfaces.length - 1 ? '1px solid var(--border-color)' : 'none',
                          background: adminDown ? 'rgba(100,100,100,0.05)' : isUp ? 'rgba(0,200,100,0.03)' : 'rgba(255,100,100,0.04)',
                          opacity: adminDown ? 0.55 : 1,
                        }}>
                          <span style={{ fontSize: 16 }}>{adminDown ? '⭕' : isUp ? '🟢' : '🔴'}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{iface.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              #{iface.index} · {formatSpeed(iface.speed)} · MTU: {iface.mtu}
                              {iface.mac && ` · ${iface.mac}`}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 11, padding: '1px 8px', borderRadius: 8,
                            background: adminDown ? 'var(--text-secondary)22' : isUp ? 'var(--success)22' : 'var(--danger)22',
                            color: adminDown ? 'var(--text-secondary)' : isUp ? 'var(--success)' : 'var(--danger)',
                            fontWeight: 600,
                          }}>
                            {adminDown ? 'ADMIN DOWN' : isUp ? 'UP' : 'DOWN'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ marginBottom: 24, background: 'rgba(255,100,100,0.05)' }}>
              <p style={{ color: 'var(--danger)', fontWeight: 600 }}>❌ {result.message}</p>
            </div>
          )}

          <CopyButton text={JSON.stringify(result, null, 2)} />
        </>
      )}
    </div>
  );
}
