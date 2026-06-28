import { useState, useCallback } from 'react';
import { runScenario } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import CopyButton from '../../components/common/CopyButton';

const STEP_TYPES = [
  { value: 'dns', label: 'DNS Lookup', icon: '🔍' },
  { value: 'http', label: 'HTTP Test', icon: '🌐' },
  { value: 'ssl', label: 'SSL Check', icon: '🔒' },
  { value: 'headers', label: 'HTTP Headers', icon: '📋' },
];

const DEFAULT_SCENARIO = {
  name: '',
  steps: [
    { type: 'dns', target: '', recordTypes: ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS'] },
    { type: 'http', target: '', method: 'GET' },
    { type: 'ssl', target: '' },
    { type: 'headers', target: '' },
  ],
};

export default function ScenarioRunner() {
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedScenarios, setSavedScenarios] = useState(() => {
    try { return JSON.parse(localStorage.getItem('superapp-scenarios') || '[]'); } catch { return []; }
  });

  const updateStep = (i, field, value) => {
    const s = { ...scenario };
    s.steps[i] = { ...s.steps[i], [field]: value };
    setScenario(s);
  };

  const addStep = () => {
    setScenario({ ...scenario, steps: [...scenario.steps, { type: 'dns', target: '' }] });
  };

  const removeStep = (i) => {
    setScenario({ ...scenario, steps: scenario.steps.filter((_, idx) => idx !== i) });
  };

  const run = async () => {
    if (scenario.steps.some(s => !s.target?.trim())) {
      setError('All steps need a target value'); return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await runScenario(scenario.steps.map(s => ({
        ...s,
        target: s.target.trim(),
        ...(s.type === 'dns' ? { recordTypes: ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS'] } : {}),
        ...(s.type === 'http' ? { method: s.method || 'GET' } : {}),
      })));
      if (data.error) { setError(data.error); return; }
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const saveScenario = () => {
    if (!scenario.name.trim()) {
      const name = prompt('Scenario name:');
      if (!name) return;
      setScenario({ ...scenario, name });
      const updated = [{ ...scenario, name }, ...savedScenarios].slice(0, 20);
      setSavedScenarios(updated);
      localStorage.setItem('superapp-scenarios', JSON.stringify(updated));
    } else {
      const updated = [{ ...scenario }, ...savedScenarios].slice(0, 20);
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

  const getStatusIcon = (status) => {
    if (status === 'success') return '✅';
    if (status === 'warning') return '⚠️';
    if (status === 'error') return '❌';
    return '⏳';
  };

  const inputStyle = { width: '100%' };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>🎯 Scenario Runner</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Define multi-step network checks and run them with one click.
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <input value={scenario.name} onChange={e => setScenario({ ...scenario, name: e.target.value })}
            placeholder="Scenario name (optional)" style={{ flex: 1, maxWidth: 300 }} />
          <button className="btn-primary" onClick={run} disabled={loading} style={{ height: 40 }}>
            {loading ? '⏳' : '▶ Run All'}
          </button>
          <button className="btn-secondary" onClick={saveScenario} style={{ height: 40 }}>💾 Save</button>
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

      {error && <ErrorMessage message={error} />}
      {loading && <LoadingSpinner text="Running scenario..." />}

      {result && !loading && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>
              Results: {result.passed}/{result.total} passed
            </h3>
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
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Step {stepResult.step}: {stepResult.type.toUpperCase()}</span>
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

              {stepResult.result && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {stepResult.type === 'dns' && stepResult.result.records && (
                    <div>Records: {stepResult.result.records.length}</div>
                  )}
                  {stepResult.type === 'http' && stepResult.result.statusCode && (
                    <div>Status: {stepResult.result.statusCode}</div>
                  )}
                  {stepResult.type === 'ssl' && stepResult.result.daysLeft !== undefined && (
                    <div>SSL: {stepResult.result.daysLeft} days left · {stepResult.result.subject}</div>
                  )}
                  {stepResult.type === 'headers' && stepResult.result.statusCode && (
                    <div>Headers: {stepResult.result.statusCode} · {Object.keys(stepResult.result.headers || {}).length} headers</div>
                  )}
                </div>
              )}

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
    </div>
  );
}
