import { useState, useCallback, useEffect } from 'react';
import { runScenario } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import CopyButton from '../../components/common/CopyButton';

const STEP_TYPES = [
  { value: 'dns', label: 'DNS Lookup', icon: '🔍' },
  { value: 'http', label: 'HTTP Test', icon: '🌐' },
  { value: 'ssl', label: 'SSL Check', icon: '🔒' },
  { value: 'headers', label: 'HTTP Headers', icon: '📋' },
  { value: 'ping', label: 'Ping', icon: '📶' },
  { value: 'portscan', label: 'Port Scan', icon: '🔌' },
  { value: 'traceroute', label: 'Traceroute', icon: '🗺️' },
];

const TEMPLATES = [
  {
    name: 'Quick Website Health',
    desc: 'DNS → HTTP → SSL → Headers',
    steps: [
      { type: 'dns', target: '', timeout: 15000, recordTypes: ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS'] },
      { type: 'http', target: '', method: 'GET', timeout: 15000 },
      { type: 'ssl', target: '', timeout: 15000 },
      { type: 'headers', target: '', timeout: 15000 },
    ],
  },
  {
    name: 'Full Security Audit',
    desc: 'SSL + Headers + Port Scan + Ping',
    steps: [
      { type: 'ssl', target: '', timeout: 15000 },
      { type: 'headers', target: '', timeout: 15000 },
      { type: 'portscan', target: '', timeout: 30000 },
      { type: 'ping', target: '', timeout: 15000 },
    ],
  },
  {
    name: 'Network Recon',
    desc: 'Ping → DNS → Traceroute → Port Scan',
    steps: [
      { type: 'ping', target: '', timeout: 15000 },
      { type: 'dns', target: '', timeout: 15000, recordTypes: ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS'] },
      { type: 'traceroute', target: '', timeout: 30000 },
      { type: 'portscan', target: '', timeout: 30000 },
    ],
  },
  {
    name: 'Deep Dive',
    desc: 'DNS + SSL + Headers + HTTP Test + Ping + Port Scan + Traceroute',
    steps: [
      { type: 'dns', target: '', timeout: 15000, recordTypes: ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS'] },
      { type: 'ssl', target: '', timeout: 15000 },
      { type: 'headers', target: '', timeout: 15000 },
      { type: 'http', target: '', method: 'GET', timeout: 15000 },
      { type: 'ping', target: '', timeout: 15000 },
      { type: 'portscan', target: '', timeout: 30000 },
      { type: 'traceroute', target: '', timeout: 30000 },
    ],
  },
  {
    name: 'SSL Health Check',
    desc: 'SSL + Headers (security-focused)',
    steps: [
      { type: 'ssl', target: '', timeout: 15000 },
      { type: 'headers', target: '', timeout: 15000 },
      { type: 'ping', target: '', timeout: 15000 },
    ],
  },
];

const DEFAULT_SCENARIO = {
  name: '',
  steps: [
    { type: 'dns', target: '', recordTypes: ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS'], timeout: 15000 },
    { type: 'http', target: '', method: 'GET', timeout: 15000 },
    { type: 'ssl', target: '', timeout: 15000 },
    { type: 'headers', target: '', timeout: 15000 },
  ],
  schedule: { enabled: false, frequency: 'daily', time: '09:00' },
  webhookUrl: '',
};

function getNextRun(frequency, time) {
  const [h, m] = (time || '09:00').split(':').map(Number);
  const now = new Date();
  let next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next <= now) {
    if (frequency === 'daily') next.setDate(next.getDate() + 1);
    else if (frequency === 'weekly') next.setDate(next.getDate() + (7 - next.getDay() + 1) % 7 || 7);
    else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString();
}

function isDue(scenario) {
  if (!scenario.schedule?.enabled) return false;
  const nextRun = scenario.schedule.nextRun ? new Date(scenario.schedule.nextRun) : null;
  if (!nextRun) return false;
  return new Date() >= nextRun;
}

export default function ScenarioRunner() {
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [runHistory, setRunHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('superapp-scenario-runs') || '[]'); } catch { return []; }
  });
  const [savedScenarios, setSavedScenarios] = useState(() => {
    try { return JSON.parse(localStorage.getItem('superapp-scenarios') || '[]'); } catch { return []; }
  });
  const [webhookStatus, setWebhookStatus] = useState('');

  useEffect(() => {
    const due = savedScenarios.find(s => isDue(s));
    if (due) {
      setScenario(due);
      setTimeout(() => run(true), 500);
    }
  }, []);

  const updateStep = (i, field, value) => {
    const s = { ...scenario, steps: scenario.steps.map((step, idx) => idx === i ? { ...step, [field]: value } : step) };
    setScenario(s);
  };

  const addStep = () => {
    setScenario({ ...scenario, steps: [...scenario.steps, { type: 'dns', target: '', timeout: 15000 }] });
  };

  const removeStep = (i) => {
    setScenario({ ...scenario, steps: scenario.steps.filter((_, idx) => idx !== i) });
  };

  const moveStep = (i, direction) => {
    const j = i + direction;
    if (j < 0 || j >= scenario.steps.length) return;
    const steps = [...scenario.steps];
    [steps[i], steps[j]] = [steps[j], steps[i]];
    setScenario({ ...scenario, steps });
  };

  const useTemplate = (template) => {
    setScenario({ ...DEFAULT_SCENARIO, name: template.name, steps: template.steps.map(s => ({ ...s })) });
    setResult(null);
    setError('');
  };

  const run = async (isScheduled = false) => {
    if (scenario.steps.some(s => !s.target?.trim())) {
      setError('All steps need a target value'); return;
    }
    setLoading(true); setError(''); setResult(null);

    const payload = scenario.steps.map(s => ({
      ...s,
      target: s.target.trim(),
      timeout: s.timeout || 15000,
      ...(s.type === 'dns' ? { recordTypes: ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS'] } : {}),
      ...(s.type === 'http' ? { method: s.method || 'GET' } : {}),
      ...(s.type === 'portscan' ? { ports: [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 3306, 3389, 5432, 8080, 8443] } : {}),
    }));

    try {
      const data = await runScenario(payload);
      if (data.error) { setError(data.error); setLoading(false); return; }
      setResult(data);

      const entry = {
        id: Date.now().toString(),
        scenarioName: scenario.name || 'Unnamed',
        timestamp: new Date().toISOString(),
        passed: data.passed,
        total: data.total,
        results: data.results,
      };
      const updated = [entry, ...runHistory].slice(0, 50);
      setRunHistory(updated);
      localStorage.setItem('superapp-scenario-runs', JSON.stringify(updated));

      if (scenario.webhookUrl) {
        try {
          setWebhookStatus('sending');
          const resp = await fetch(scenario.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'scenario.completed', scenario: scenario.name, passed: data.passed, total: data.total, results: data.results, timestamp: new Date().toISOString() }),
          });
          setWebhookStatus(resp.ok ? 'sent' : 'failed');
        } catch {
          setWebhookStatus('failed');
        }
      }

      if (isScheduled && scenario.schedule?.enabled) {
        const nextRun = getNextRun(scenario.schedule.frequency, scenario.schedule.time);
        const updatedScenario = { ...scenario, schedule: { ...scenario.schedule, nextRun, lastRun: new Date().toISOString() } };
        const existsIdx = savedScenarios.findIndex(s => s.name === scenario.name);
        const saved = existsIdx >= 0
          ? savedScenarios.map((s, i) => i === existsIdx ? updatedScenario : s)
          : [updatedScenario, ...savedScenarios];
        setSavedScenarios(saved);
        localStorage.setItem('superapp-scenarios', JSON.stringify(saved));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const saveScenario = () => {
    if (!scenario.name.trim()) {
      const name = prompt('Scenario name:');
      if (!name) return;
      setScenario(s => ({ ...s, name }));
      const updated = [{ ...scenario, name }, ...savedScenarios].slice(0, 20);
      setSavedScenarios(updated);
      localStorage.setItem('superapp-scenarios', JSON.stringify(updated));
    } else {
      const exists = savedScenarios.findIndex(s => s.name === scenario.name);
      const updated = exists >= 0
        ? savedScenarios.map((s, i) => i === exists ? { ...scenario } : s)
        : [{ ...scenario }, ...savedScenarios].slice(0, 20);
      setSavedScenarios(updated);
      localStorage.setItem('superapp-scenarios', JSON.stringify(updated));
    }
  };

  const loadScenario = useCallback((s) => {
    setScenario({ ...s });
    setResult(null);
    setError('');
  }, []);

  const deleteScenario = (i) => {
    const updated = savedScenarios.filter((_, idx) => idx !== i);
    setSavedScenarios(updated);
    localStorage.setItem('superapp-scenarios', JSON.stringify(updated));
  };

  const exportScenario = () => {
    const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name || 'scenario'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importScenario = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const s = JSON.parse(ev.target.result);
          if (!s.steps || !Array.isArray(s.steps)) { alert('Invalid scenario file'); return; }
          setScenario({ ...DEFAULT_SCENARIO, ...s });
          setResult(null);
          setError('');
        } catch { alert('Invalid JSON file'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const getStatusIcon = (status) => {
    if (status === 'success') return '✅';
    if (status === 'warning') return '⚠️';
    if (status === 'error') return '❌';
    return '⏳';
  };

  const getStepIcon = (type) => {
    const t = STEP_TYPES.find(s => s.value === type);
    return t ? t.icon : '🔍';
  };

  const passedSteps = result?.results?.filter(r => r.status === 'success').length || 0;
  const totalSteps = result?.results?.length || 0;
  const successPct = totalSteps > 0 ? Math.round((passedSteps / totalSteps) * 100) : 0;

  const inputStyle = { width: '100%' };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🎯 Scenario Runner</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Define multi-step network check playbooks, schedule them, and get notified via webhooks.
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <details style={{ marginBottom: 16 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            📋 Templates ({TEMPLATES.length})
          </summary>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {TEMPLATES.map((t, i) => (
              <div key={i} style={{
                padding: '8px 12px', borderRadius: 'var(--radius)',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                cursor: 'pointer', fontSize: 13, flex: '1 1 180px',
              }} onClick={() => useTemplate(t)}>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{t.desc}</div>
                <button className="btn-sm" style={{ marginTop: 4, background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 10 }}>Use Template</button>
              </div>
            ))}
          </div>
        </details>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={scenario.name} onChange={e => setScenario({ ...scenario, name: e.target.value })}
            placeholder="Scenario name" style={{ flex: 1, maxWidth: 300 }} />
          <button className="btn-primary" onClick={() => run()} disabled={loading} style={{ height: 40 }}>
            {loading ? '⏳' : '▶ Run All'}
          </button>
          <button className="btn-secondary" onClick={saveScenario} style={{ height: 40 }}>💾 Save</button>
          <button className="btn-secondary" onClick={exportScenario} style={{ height: 40 }}>📤 Export</button>
          <button className="btn-secondary" onClick={importScenario} style={{ height: 40 }}>📥 Import</button>
        </div>

        {savedScenarios.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {savedScenarios.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 'var(--radius)',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: 12,
              }}>
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                <span style={{ color: 'var(--text-secondary)' }}>({s.steps.length} steps)</span>
                {s.schedule?.enabled && <span style={{ fontSize: 10, color: 'var(--accent)' }}>🕐</span>}
                <button className="btn-sm" onClick={() => loadScenario(s)}
                  style={{ padding: '2px 6px', background: 'var(--accent)', color: '#fff', borderRadius: 4, fontSize: 11 }}>Load</button>
                <button className="btn-sm" onClick={() => deleteScenario(i)}
                  style={{ padding: '2px 6px', background: 'transparent', color: 'var(--danger)', borderRadius: 4, fontSize: 11 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {scenario.steps.map((step, i) => (
          <div key={i} style={{
            padding: 12, marginBottom: 8, borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, minWidth: 30 }}>#{i + 1}</span>
              <select value={step.type} onChange={e => updateStep(i, 'type', e.target.value)}
                style={{ width: 140, ...inputStyle }}>
                {STEP_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
              <input value={step.target} onChange={e => updateStep(i, 'target', e.target.value)}
                placeholder={step.type === 'dns' ? 'example.com' : 'https://example.com'}
                style={{ flex: 1, minWidth: 180, ...inputStyle }} />
              {step.type === 'http' && (
                <select value={step.method || 'GET'} onChange={e => updateStep(i, 'method', e.target.value)}
                  style={{ width: 90, ...inputStyle }}>
                  {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>⏱</span>
                <select value={step.timeout || 15000} onChange={e => updateStep(i, 'timeout', parseInt(e.target.value))}
                  style={{ width: 80, padding: '2px 4px', fontSize: 11 }}>
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                  <option value={15000}>15s</option>
                  <option value={30000}>30s</option>
                  <option value={60000}>60s</option>
                </select>
              </div>
              <button className="btn-secondary btn-sm" onClick={() => moveStep(i, -1)}
                disabled={i === 0}
                style={{ padding: '4px 6px', fontSize: 12, opacity: i === 0 ? 0.3 : 1 }}>▲</button>
              <button className="btn-secondary btn-sm" onClick={() => moveStep(i, 1)}
                disabled={i === scenario.steps.length - 1}
                style={{ padding: '4px 6px', fontSize: 12, opacity: i === scenario.steps.length - 1 ? 0.3 : 1 }}>▼</button>
              {scenario.steps.length > 1 && (
                <button className="btn-secondary btn-sm" onClick={() => removeStep(i)}
                  style={{ color: 'var(--danger)', padding: '4px 8px' }}>✕</button>
              )}
            </div>
          </div>
        ))}

        <button className="btn-secondary btn-sm" onClick={addStep} style={{ marginTop: 8 }}>
          + Add Step
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>⚙️ Schedule & Webhook</h4>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={scenario.schedule?.enabled || false}
              onChange={e => setScenario({ ...scenario, schedule: { ...scenario.schedule, enabled: e.target.checked, frequency: scenario.schedule?.frequency || 'daily', time: scenario.schedule?.time || '09:00' } })} />
            🕐 Schedule
          </label>
          {scenario.schedule?.enabled && (
            <>
              <select value={scenario.schedule.frequency || 'daily'}
                onChange={e => setScenario({ ...scenario, schedule: { ...scenario.schedule, frequency: e.target.value } })}
                style={{ fontSize: 13, padding: '4px 8px' }}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <input type="time" value={scenario.schedule.time || '09:00'}
                onChange={e => setScenario({ ...scenario, schedule: { ...scenario.schedule, time: e.target.value } })}
                style={{ fontSize: 13, padding: '4px 8px' }} />
              {scenario.schedule.nextRun && (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Next run: {new Date(scenario.schedule.nextRun).toLocaleString()}
                </span>
              )}
            </>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <input value={scenario.webhookUrl || ''} onChange={e => setScenario({ ...scenario, webhookUrl: e.target.value })}
            placeholder="Webhook URL (optional) — POST results here on completion"
            style={{ width: '100%', maxWidth: 500, fontSize: 13 }} />
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {loading && <LoadingSpinner text="Running scenario..." />}

      {webhookStatus && !loading && (
        <div style={{ fontSize: 12, marginBottom: 8, color: webhookStatus === 'sent' ? 'var(--success)' : webhookStatus === 'sending' ? 'var(--warning)' : 'var(--danger)' }}>
          Webhook: {webhookStatus === 'sent' ? '✅ Delivered' : webhookStatus === 'sending' ? '⏳ Sending...' : '❌ Failed'}
        </div>
      )}

      {result && !loading && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>
                Results: {passedSteps}/{totalSteps} passed
              </h3>
              <div style={{ marginTop: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 120, height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                  <div style={{ width: `${successPct}%`, height: '100%', borderRadius: 3, background: successPct === 100 ? 'var(--success)' : successPct >= 50 ? 'var(--warning)' : 'var(--danger)', transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{successPct}%</span>
              </div>
            </div>
            <CopyButton text={JSON.stringify(result.results, null, 2)} />
          </div>

          {result.results?.map((stepResult, i) => (
            <div key={i} style={{
              padding: 16, marginBottom: 12, borderRadius: 'var(--radius)',
              border: '1px solid',
              borderColor: stepResult.status === 'success' ? 'var(--success)' :
                stepResult.status === 'warning' ? 'var(--warning)' : 'var(--danger)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{getStatusIcon(stepResult.status)}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{getStepIcon(stepResult.type)} Step {stepResult.step}: {stepResult.type.toUpperCase()}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{stepResult.target}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {stepResult.timing}ms
                </span>
              </div>

              {stepResult.error && (
                <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 4 }}>
                  Error: {stepResult.error}
                </div>
              )}

              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {stepResult.type === 'dns' && stepResult.result?.records && (
                  <div>📝 Records: {stepResult.result.records.length} · A: {stepResult.result.records.filter(r => r.type === 'A').length} · AAAA: {stepResult.result.records.filter(r => r.type === 'AAAA').length} · MX: {stepResult.result.records.filter(r => r.type === 'MX').length}</div>
                )}
                {stepResult.type === 'http' && stepResult.result?.statusCode && (
                  <div>📊 Status: {stepResult.result.statusCode} · Size: {stepResult.result.contentLength || '—'}</div>
                )}
                {stepResult.type === 'ssl' && stepResult.result?.daysLeft !== undefined && (
                  <div>🔒 SSL: {stepResult.result.daysLeft} days left · {stepResult.result.subject || ''} · {stepResult.result.issuer?.commonName || ''}</div>
                )}
                {stepResult.type === 'headers' && stepResult.result?.statusCode && (
                  <div>📋 Headers: {stepResult.result.statusCode} · {Object.keys(stepResult.result.headers || {}).length} headers · Security: {(['strict-transport-security', 'x-frame-options', 'content-security-policy'].filter(h => stepResult.result.headers?.[h])).length}/3</div>
                )}
                {stepResult.type === 'ping' && stepResult.result && (
                  <div>📶 Packet loss: {stepResult.result.packetLoss}% · RTT: {stepResult.result.min}/{stepResult.result.avg}/{stepResult.result.max}ms</div>
                )}
                {stepResult.type === 'portscan' && stepResult.result?.openPorts && (
                  <div>🔌 Open ports: {stepResult.result.openPorts.length} · {stepResult.result.openPorts.join(', ')}</div>
                )}
              </div>

              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--accent)' }}>Full Response</summary>
                <pre style={{
                  marginTop: 8, padding: 8, borderRadius: 6, fontSize: 11,
                  background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>
                  {JSON.stringify(stepResult.result, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}

      {runHistory.length > 0 && !loading && (
        <div className="card" style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📜 Run History ({runHistory.length})</h4>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {runHistory.slice(0, 20).map((entry, i) => (
              <div key={entry.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13,
                cursor: 'pointer',
              }} onClick={() => entry.results && setResult({ results: entry.results, passed: entry.passed, total: entry.total })}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: entry.passed === entry.total ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {entry.passed}/{entry.total}
                  </span>
                  <span style={{ fontWeight: 600 }}>{entry.scenarioName}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {entry.passed === entry.total ? '✅' : '⚠️'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
