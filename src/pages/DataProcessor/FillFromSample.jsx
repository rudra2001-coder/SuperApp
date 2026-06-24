import { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx-js-style';
import { useSupabase } from '../../context/SupabaseContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const STEPS = [
  { key: 'upload-demo', num: 1, label: 'Upload Demo', icon: '📋' },
  { key: 'upload-source', num: 2, label: 'Upload Source', icon: '📦' },
  { key: 'mapping', num: 3, label: 'Column Map', icon: '🔗' },
  { key: 'processing', num: 4, label: 'Process', icon: '⚙️' },
  { key: 'preview', num: 5, label: 'Preview & Edit', icon: '✏️' },
  { key: 'export', num: 6, label: 'Export', icon: '⬇' },
];

export default function FillFromSample() {
  const { supabase, session, configured } = useSupabase();
  const userId = session?.user?.id;
  const sessionIdRef = useRef(null);

  const [_sessions, setSessions] = useLocalStorage('superapp-data-sessions', {});
  const [currentSession, setCurrentSession] = useState(null);
  const [step, setStep] = useState('upload-demo');
  const [loading, setLoading] = useState(false);
  const [dragOverDemo, setDragOverDemo] = useState(false);
  const [dragOverSource, setDragOverSource] = useState(false);
  const [notification, setNotification] = useState(null);
  const [processingLog, setProcessingLog] = useState([]);
  const [dbStatus, setDbStatus] = useState({ demo: false, source: false });

  const demoInputRef = useRef(null);
  const sourceInputRef = useRef(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const addLog = (msg) => setProcessingLog(p => [...p, msg]);

  // Sync current session to localStorage + Supabase
  const saveSession = useCallback(async (updates) => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    setSessions(prev => {
      const existing = prev[sid] || {};
      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      return { ...prev, [sid]: updated };
    });

    setCurrentSession(prev => ({ ...prev, ...updates }));

    if (configured && userId) {
      try {
        const { data: existing } = await supabase
          .from('data_sessions')
          .select('id')
          .eq('session_id', sid)
          .eq('user_id', userId)
          .maybeSingle();

        const record = {
          session_id: sid,
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          await supabase.from('data_sessions').update(record).eq('id', existing.id);
        } else {
          record.created_at = new Date().toISOString();
          await supabase.from('data_sessions').insert(record);
        }
      } catch (err) {
        if (err.code === '42P01') {
          console.warn('data_sessions table missing, skipping DB save');
        } else {
          console.error('DB save error:', err);
        }
      }
    }
  }, [configured, userId, supabase, setSessions]);

  const startNewSession = () => {
    const sid = crypto.randomUUID();
    sessionIdRef.current = sid;
    const sess = {
      id: sid,
      step: 'upload-demo',
      demoFileName: '',
      demoHeaders: [],
      demoRows: [],
      sourceFileName: '',
      sourceHeaders: [],
      sourceRows: [],
      colMap: {},
      filledData: [],
      rules: { clientCodeUnique: true, mobileFallback: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSessions(prev => ({ ...prev, [sid]: sess }));
    setCurrentSession(sess);
    setStep('upload-demo');
    setDbStatus({ demo: false, source: false });
    setProcessingLog([]);
  };

  // Init a new session on mount
  useEffect(() => {
    if (!sessionIdRef.current) {
      const sid = crypto.randomUUID();
      sessionIdRef.current = sid;
      const sess = {
        id: sid,
        step: 'upload-demo',
        demoFileName: '',
        demoHeaders: [],
        demoRows: [],
        sourceFileName: '',
        sourceHeaders: [],
        sourceRows: [],
        colMap: {},
        filledData: [],
        rules: { clientCodeUnique: true, mobileFallback: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSessions(prev => ({ ...prev, [sid]: sess }));
      setCurrentSession(sess);
    }
  }, []);

  const readFile = async (file) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!json.length) throw new Error('No data found in file');
    return { headers: Object.keys(json[0]), rows: json, wb };
  };

  // STEP 1: Upload demo file
  const handleDemoUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const { headers, rows } = await readFile(file);
      await saveSession({
        step: 'upload-demo',
        demoFileName: file.name,
        demoHeaders: headers,
        demoRows: rows,
      });
      setStep('upload-source');
      setDbStatus(p => ({ ...p, demo: true }));
      showNotif(`Demo file "${file.name}" saved to database (${headers.length} cols, ${rows.length} rows)`);
    } catch (err) {
      showNotif('Error: ' + err.message, 'error');
    }
    setLoading(false);
  };

  // STEP 2: Upload source file
  const handleSourceUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const { headers, rows } = await readFile(file);

      const map = {};
      const used = new Set();
      const demoHeaders = currentSession?.demoHeaders || [];
      demoHeaders.forEach(sh => {
        const sn = sh.toLowerCase().replace(/[\s_\-.]/g, '');
        for (const src of headers) {
          const srcn = src.toLowerCase().replace(/[\s_\-.]/g, '');
          if ((sn === srcn || srcn.includes(sn) || sn.includes(srcn)) && !used.has(src)) {
            map[sh] = src;
            used.add(src);
            break;
          }
        }
      });

      await saveSession({
        step: 'upload-source',
        sourceFileName: file.name,
        sourceHeaders: headers,
        sourceRows: rows,
        colMap: map,
      });
      setDbStatus(p => ({ ...p, source: true }));
      showNotif(`Source file "${file.name}" saved (${headers.length} cols, ${rows.length} rows)`);
      setStep('mapping');
    } catch (err) {
      showNotif('Error: ' + err.message, 'error');
    }
    setLoading(false);
  };

  // STEP 4: Process & fill data
  const processFill = async () => {
    setLoading(true);
    setProcessingLog([]);
    const sess = currentSession;
    if (!sess) return;

    const { demoHeaders, demoRows, sourceRows, colMap } = sess;
    const demoFirstRow = demoRows.length > 0 ? demoRows[0] : {};
    const mobileCol = Object.entries(colMap).find(([demo, _src]) =>
      /mobile|phone|cell|contact|মোবাইল/i.test(demo)
    );
    const clientCodeCol = Object.entries(colMap).find(([demo, _src2]) =>
      /username|user.?name|login|client.?code|c.?code|user.?id/i.test(demo)
    );

    addLog(`Demo columns: ${demoHeaders.length}`);
    addLog(`Source rows: ${sourceRows.length}`);
    addLog(`Mapped columns: ${Object.keys(colMap).length}`);
    if (clientCodeCol) addLog(`Client code column detected: ${clientCodeCol[0]} ← ${clientCodeCol[1]}`);
    if (mobileCol) addLog(`Mobile column detected: ${mobileCol[0]} ← ${mobileCol[1]}`);

    // Build filled data
    let filled = sourceRows.map((srcRow, _idx) => {
      const r = {};
      demoHeaders.forEach(h => {
        const mapped = colMap[h];
        if (mapped && srcRow[mapped] !== undefined && String(srcRow[mapped]).trim() !== '') {
          r[h] = String(srcRow[mapped]).trim();
        }
      });
      return r;
    });

    // Fill empty cells from demo first row
    addLog('Filling empty cells with demo data...');
    let fillCount = 0;
    filled.forEach(row => {
      demoHeaders.forEach(h => {
        if (!row[h] || row[h] === '') {
          const demoVal = demoFirstRow[h];
          if (demoVal !== undefined && String(demoVal).trim() !== '') {
            row[h] = String(demoVal).trim();
            fillCount++;
          } else {
            row[h] = '';
          }
        }
      });
    });
    addLog(`Filled ${fillCount} empty cells from demo template`);

    // Make client code unique
    if (clientCodeCol) {
      addLog('Enforcing unique client codes...');
      const demoCol = clientCodeCol[0];
      const seen = {};
      let dupFixed = 0;
      filled.forEach((row, i) => {
        let code = row[demoCol] || '';
        if (!code || code === '') {
          code = `CLT${String(i + 1).padStart(4, '0')}`;
          row[demoCol] = code;
          dupFixed++;
        }
        if (seen[code] !== undefined) {
          let suffix = 1;
          let newCode;
          do {
            newCode = `${code}_${suffix}`;
            suffix++;
          } while (seen[newCode] !== undefined);
          row[demoCol] = newCode;
          seen[newCode] = true;
          dupFixed++;
        } else {
          seen[code] = true;
        }
      });
      addLog(`Fixed ${dupFixed} client code issues`);
    }

    // Handle mobile fallback
    if (mobileCol) {
      addLog('Checking mobile numbers...');
      const demoCol = mobileCol[0];
      let emptyMobile = 0;
      filled.forEach(row => {
        if (!row[demoCol] || row[demoCol] === '') {
          row[demoCol] = '01XXXXXXXXX';
          emptyMobile++;
        }
      });
      if (emptyMobile > 0) addLog(`Placed demo number for ${emptyMobile} empty mobile fields`);
      else addLog('All mobile numbers present');
    }

    // Fill completely empty columns (not mapped)
    addLog('Completing unmapped columns...');
    let unmappedFill = 0;
    filled.forEach(row => {
      demoHeaders.forEach(h => {
        if (row[h] === undefined || row[h] === '') {
          const demoVal = demoFirstRow[h];
          row[h] = demoVal !== undefined && String(demoVal).trim() !== ''
            ? String(demoVal).trim()
            : '';
          if (row[h]) unmappedFill++;
        }
      });
    });
    if (unmappedFill > 0) addLog(`Filled ${unmappedFill} unmapped column cells`);

    addLog(`✅ Processing complete — ${filled.length} rows ready`);

    await saveSession({
      step: 'preview',
      filledData: filled,
      processingLog: processingLog.concat(['✅ Processing complete']),
    });
    setLoading(false);
    setStep('preview');
  };

  const handleCellEdit = (rowIdx, col, value) => {
    setCurrentSession(prev => {
      const next = { ...prev };
      next.filledData = [...(next.filledData || [])];
      next.filledData[rowIdx] = { ...next.filledData[rowIdx], [col]: value };
      return next;
    });
  };

  // Export and clear DB
  const exportExcel = async () => {
    const data = currentSession?.filledData;
    const headers = currentSession?.demoHeaders;
    if (!data?.length || !headers?.length) return;

    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    for (let c = 0; c < headers.length; c++) {
      const ref = XLSX.utils.encode_cell({ c, r: 0 });
      if (ws[ref]) {
        ws[ref].s = {
          fill: { fgColor: { rgb: '000000' } },
          font: { color: { rgb: 'FFFFFF' }, bold: true, name: 'Calibri', sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }
    }
    for (let R = 1; R <= data.length; R++) {
      for (let C = 0; C < headers.length; C++) {
        const ref = XLSX.utils.encode_cell({ c: C, r: R });
        if (ws[ref]) ws[ref].s = { font: { name: 'Calibri', sz: 11 } };
      }
    }
    ws['!cols'] = headers.map(h => ({ wch: h.length > 15 ? 22 : 14 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const name = (currentSession?.demoFileName || 'export').replace(/\.[^.]+$/, '') + '_Filled.xlsx';
    XLSX.writeFile(wb, name);

    // Clear DB after export
    await clearSession();
    showNotif(`✅ "${name}" downloaded — database cleared`);
  };

  const exportCSV = () => {
    const data = currentSession?.filledData;
    const headers = currentSession?.demoHeaders;
    if (!data?.length || !headers?.length) return;
    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const name = (currentSession?.demoFileName || 'export').replace(/\.[^.]+$/, '') + '_Filled.csv';
    XLSX.writeFile(wb, name);
    clearSession();
    showNotif(`✅ "${name}" downloaded — database cleared`);
  };

  const clearSession = async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    setSessions(prev => {
      const { [sid]: _, ...rest } = prev;
      return rest;
    });

    if (configured && userId) {
      try {
        await supabase.from('data_sessions').delete().eq('session_id', sid).eq('user_id', userId);
      } catch { /* table might not exist */ }
    }

    sessionIdRef.current = null;
    setCurrentSession(null);
    setProcessingLog([]);
    setDbStatus({ demo: false, source: false });
    startNewSession();
  };

  const sess = currentSession;
  const mappedCount = sess ? Object.keys(sess.colMap || {}).length : 0;
  const demoHeaders = sess?.demoHeaders || [];
  const filledData = sess?.filledData || [];
  const missingCols = demoHeaders.filter(h => !sess?.colMap?.[h]);

  const isStepEnabled = (s) => {
    if (s === 'upload-demo') return true;
    if (s === 'upload-source') return currentSession?.demoHeaders?.length > 0;
    if (s === 'mapping') return currentSession?.sourceHeaders?.length > 0;
    if (s === 'processing') return mappedCount > 0;
    if (s === 'preview') return filledData.length > 0;
    if (s === 'export') return filledData.length > 0;
    return false;
  };

  const btnStyle = (enabled, active) => ({
    padding: '8px 16px',
    borderRadius: 24,
    fontSize: 12,
    fontWeight: 600,
    border: 'none',
    cursor: enabled ? 'pointer' : 'default',
    background: active ? '#107c41' : enabled ? '#1e2535' : '#111827',
    color: active ? '#fff' : enabled ? '#9ca3af' : '#374151',
    opacity: enabled ? 1 : 0.4,
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  });

  const dzBase = {
    border: '2px dashed #2d3748',
    borderRadius: 12,
    padding: '36px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#0f1117',
    position: 'relative',
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* --- Notification Bar --- */}
      {notification && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
          fontWeight: 500,
          background: notification.type === 'error' ? '#1a0a0a' : '#0a1f12',
          border: `1px solid ${notification.type === 'error' ? '#450a0a' : '#064e2e'}`,
          color: notification.type === 'error' ? '#f87171' : '#6ee7b7',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>{notification.type === 'error' ? '❌' : '✅'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* --- Step Navigator Mark 2 --- */}
      <div style={{
        background: '#161b27',
        border: '1px solid #1e2535',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#107c41,#0e5c30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#fff',
            }}>M2</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
                Fill from Sample — Mark II
              </div>
              <div style={{ fontSize: 11, color: '#4a5568', marginTop: 2 }}>
                {currentSession?.demoFileName ?
                  `Demo: ${currentSession.demoFileName} | Source: ${currentSession?.sourceFileName || '—'}` :
                  'No file loaded'
                }
                {dbStatus.demo && <span style={{ color: '#34d399', marginLeft: 8 }}>● DB</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={clearSession} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              border: '1px solid #2d3748', cursor: 'pointer',
              background: 'transparent', color: '#6b7280', fontFamily: 'inherit',
            }}>🔄 New Session</button>
            <button onClick={async () => {
              if (!confirm('Clear all database sessions for this user?')) return;
              if (configured && userId) {
                try {
                  await supabase.from('data_sessions').delete().eq('user_id', userId);
                  showNotif('Database cleared successfully', 'success');
                } catch { showNotif('Failed to clear DB', 'error'); }
              } else {
                showNotif('Database not configured', 'error');
              }
            }} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              border: '1px solid #450a0a', cursor: 'pointer',
              background: 'transparent', color: '#f87171', fontFamily: 'inherit',
            }}>🗑️ Clear DB</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          {STEPS.map((s, i) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <button
                onClick={() => isStepEnabled(s.key) && setStep(s.key)}
                style={{
                  ...btnStyle(isStepEnabled(s.key), step === s.key),
                  padding: '6px 14px',
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: step === s.key ? '#fff' : isStepEnabled(s.key) ? '#107c41' : '#374151',
                  color: step === s.key ? '#107c41' : '#fff',
                  fontSize: 10, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: 4,
                }}>{s.num}</span>
                {s.icon} {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <span style={{ color: '#1e2535', fontSize: 10, margin: '0 2px' }}>◀</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===== STEP 1: UPLOAD DEMO ===== */}
      {step === 'upload-demo' && (
        <div style={{
          background: '#161b27', border: '1px solid #1e2535', borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #1e2535',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: 6,
              background: '#0d3d22', color: '#34d399',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
            }}>1</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>Upload Demo / Template File</span>
            {currentSession?.demoHeaders?.length > 0 && (
              <span style={{ fontSize: 11, color: '#34d399', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>●</span> Saved to Database
              </span>
            )}
          </div>
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              This file defines the <strong style={{ color: '#9ca3af' }}>output structure</strong> — 
              its columns and first row of sample data will be used as the template for filling.
              Once uploaded, the data is saved to the database.
            </p>

            <div
              style={{
                ...dzBase,
                borderColor: dragOverDemo ? '#107c41' : '#2d3748',
                background: dragOverDemo ? '#0a1f12' : '#0f1117',
              }}
              onDragOver={e => { e.preventDefault(); setDragOverDemo(true); }}
              onDragLeave={() => setDragOverDemo(false)}
              onDrop={e => { e.preventDefault(); setDragOverDemo(false); handleDemoUpload(e.dataTransfer.files[0]); }}
              onClick={() => demoInputRef.current?.click()}
            >
              <input ref={demoInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                onChange={e => handleDemoUpload(e.target.files[0])} />
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#9ca3af', marginBottom: 4 }}>
                Drop demo file here or click to browse
              </div>
              <div style={{ fontSize: 13, color: '#4a5568' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#0d3d22', color: '#34d399', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>XLSX</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#2d1b69', color: '#a78bfa', borderRadius: 4, fontSize: 11, fontWeight: 600, marginLeft: 4 }}>XLS</span>
              </div>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div style={{
                  width: 32, height: 32, border: '2px solid #1e2535', borderTopColor: '#34d399',
                  borderRadius: '50%', animation: 'spin2 0.6s linear infinite', margin: '0 auto 8px',
                }} />
                <style>{`@keyframes spin2{to{transform:rotate(360deg)}}`}</style>
                <span style={{ fontSize: 13, color: '#6b7280' }}>Reading & saving to database...</span>
              </div>
            )}

            {currentSession?.demoHeaders?.length > 0 && (
              <div style={{
                marginTop: 16, padding: 12, borderRadius: 8,
                background: '#0a1f12', border: '1px solid #064e2e',
                fontSize: 13, color: '#6ee7b7',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>✅</span>
                <span>
                  <strong>{currentSession.demoFileName}</strong> — {currentSession.demoHeaders.length} columns, {currentSession.demoRows.length} sample rows
                  <span style={{ color: '#34d399', marginLeft: 8 }}>● DB Stored</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== STEP 2: UPLOAD SOURCE ===== */}
      {step === 'upload-source' && (
        <div style={{
          background: '#161b27', border: '1px solid #1e2535', borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #1e2535',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: 6,
              background: '#0d3d22', color: '#34d399',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
            }}>2</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>Upload Source Data File</span>
            {currentSession?.sourceHeaders?.length > 0 && (
              <span style={{ fontSize: 11, color: '#34d399', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>●</span> Saved to Database
              </span>
            )}
          </div>
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              This file contains the <strong style={{ color: '#9ca3af' }}>actual data</strong> to fill into the demo template.
              Columns will be auto-detected and mapped to the demo file structure.
            </p>

            <div style={{
              marginBottom: 16, padding: 12, borderRadius: 8,
              background: '#111827', border: '1px solid #1e2535', fontSize: 13,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ color: '#9ca3af' }}>
                📋 Demo template: <strong style={{ color: '#e2e8f0' }}>{currentSession?.demoFileName}</strong>
                <span style={{ color: '#4a5568', marginLeft: 8 }}>({currentSession?.demoHeaders?.length || 0} columns)</span>
              </span>
              <button onClick={() => setStep('upload-demo')} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                border: '1px solid #2d3748', cursor: 'pointer',
                background: 'transparent', color: '#9ca3af', fontFamily: 'inherit',
              }}>Change Demo</button>
            </div>

            <div
              style={{
                ...dzBase,
                borderColor: dragOverSource ? '#107c41' : '#2d3748',
                background: dragOverSource ? '#0a1f12' : '#0f1117',
              }}
              onDragOver={e => { e.preventDefault(); setDragOverSource(true); }}
              onDragLeave={() => setDragOverSource(false)}
              onDrop={e => { e.preventDefault(); setDragOverSource(false); handleSourceUpload(e.dataTransfer.files[0]); }}
              onClick={() => sourceInputRef.current?.click()}
            >
              <input ref={sourceInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                onChange={e => handleSourceUpload(e.target.files[0])} />
              <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#9ca3af', marginBottom: 4 }}>
                Drop source data file here
              </div>
              <div style={{ fontSize: 13, color: '#4a5568' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#0d3d22', color: '#34d399', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>XLSX</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#2d1b69', color: '#a78bfa', borderRadius: 4, fontSize: 11, fontWeight: 600, marginLeft: 4 }}>CSV</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#0d3d22', color: '#34d399', borderRadius: 4, fontSize: 11, fontWeight: 600, marginLeft: 4 }}>XLS</span>
              </div>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div style={{
                  width: 32, height: 32, border: '2px solid #1e2535', borderTopColor: '#34d399',
                  borderRadius: '50%', animation: 'spin2 0.6s linear infinite', margin: '0 auto 8px',
                }} />
                <span style={{ fontSize: 13, color: '#6b7280' }}>Reading & saving to database...</span>
              </div>
            )}

            {currentSession?.sourceHeaders?.length > 0 && (
              <div style={{
                marginTop: 16, padding: 12, borderRadius: 8,
                background: '#0a1f12', border: '1px solid #064e2e',
                fontSize: 13, color: '#6ee7b7',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>✅</span>
                <span>
                  <strong>{currentSession.sourceFileName}</strong> — {currentSession.sourceHeaders.length} columns, {currentSession.sourceRows.length} data rows
                  <span style={{ color: '#34d399', marginLeft: 8 }}>● DB Stored</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== STEP 3: MAPPING ===== */}
      {step === 'mapping' && (
        <div style={{
          background: '#161b27', border: '1px solid #1e2535', borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #1e2535',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 6,
                background: '#0d3d22', color: '#34d399',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
              }}>3</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>Column Mapping</span>
              <span style={{
                padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                background: mappedCount > 0 ? '#0d3d22' : '#1e2535',
                color: mappedCount > 0 ? '#34d399' : '#4a5568',
              }}>{mappedCount}/{demoHeaders.length} mapped</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => {
                if (!currentSession) return;
                const { demoHeaders: dh, sourceHeaders: sh } = currentSession;
                const map = {};
                const used = new Set();
                dh.forEach(h => {
                  const sn = h.toLowerCase().replace(/[\s_\-.]/g, '');
                  for (const src of sh) {
                    const srcn = src.toLowerCase().replace(/[\s_\-.]/g, '');
                    if ((sn === srcn || srcn.includes(sn) || sn.includes(srcn)) && !used.has(src)) {
                      map[h] = src;
                      used.add(src);
                      break;
                    }
                  }
                });
                saveSession({ colMap: map });
              }} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                border: '1px solid #2d3748', cursor: 'pointer',
                background: '#1e2535', color: '#9ca3af', fontFamily: 'inherit',
              }}>🔄 Auto-Detect</button>
              <button onClick={() => setStep('processing')} disabled={mappedCount === 0} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: mappedCount > 0 ? 'pointer' : 'default',
                background: mappedCount > 0 ? '#107c41' : '#1e2535',
                color: mappedCount > 0 ? '#fff' : '#4a5568',
                opacity: mappedCount > 0 ? 1 : 0.5, fontFamily: 'inherit',
              }}>⚙️ Process & Fill →</button>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{
              marginBottom: 16, padding: 12, borderRadius: 8,
              background: '#111827', border: '1px solid #1e2535', fontSize: 12, color: '#6b7280',
            }}>
              <span style={{ color: '#9ca3af' }}>← Drag from Source (right)</span> → into <strong style={{ color: '#34d399' }}>Demo columns (left)</strong>
              {missingCols.length > 0 && (
                <span style={{ marginLeft: 12, color: '#fb923c' }}>
                  ⚠️ {missingCols.length} unmapped — will use demo sample data
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
              {demoHeaders.map(h => {
                const mapped = currentSession?.colMap?.[h];
                return (
                  <div key={h} style={{
                    display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: 6,
                    alignItems: 'center', padding: '8px 10px',
                    background: '#0f1117', borderRadius: 8,
                    border: mapped ? '1px solid #064e2e' : '1px solid #1e2535',
                  }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: '#e2e8f0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }} title={h}>{h}</div>
                    <div style={{ color: '#374151', textAlign: 'center', fontSize: 12 }}>←</div>
                    <select
                      value={mapped || ''}
                      onChange={e => {
                        const newMap = { ...currentSession?.colMap, [h]: e.target.value };
                        saveSession({ colMap: newMap });
                      }}
                      style={{
                        width: '100%', fontSize: 11, padding: '4px 6px',
                        background: '#161b27', border: '1px solid #2d3748',
                        borderRadius: 5, color: '#e2e8f0', fontFamily: 'inherit',
                      }}
                    >
                      <option value="">— use demo data —</option>
                      {(currentSession?.sourceHeaders || []).map(src => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== STEP 4: PROCESSING ===== */}
      {step === 'processing' && (
        <div style={{
          background: '#161b27', border: '1px solid #1e2535', borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #1e2535',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: 6,
              background: '#0d3d22', color: '#34d399',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
            }}>4</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>Processing Data</span>
          </div>
          <div style={{ padding: 20, textAlign: 'center' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 24 }}>
                <div style={{
                  width: 48, height: 48, border: '3px solid #1e2535', borderTopColor: '#34d399',
                  borderRadius: '50%', animation: 'spin3 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin3{to{transform:rotate(360deg)}}`}</style>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af' }}>Processing data...</div>
                <div style={{
                  background: '#0f1117', border: '1px solid #1e2535', borderRadius: 8,
                  padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12, color: '#4ade80', maxHeight: 150, overflowY: 'auto',
                  width: '100%', maxWidth: 500, textAlign: 'left',
                }}>
                  {processingLog.map((l, i) => (
                    <div key={i} style={{ opacity: 1 }}>{'>'} {l}</div>
                  ))}
                  <div style={{ opacity: 0.6 }}>{'>'} Working...</div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <p style={{ fontSize: 14, color: '#6b7280' }}>Click below to start processing</p>
                <button onClick={processFill} style={{
                  marginTop: 16, padding: '12px 32px', borderRadius: 8,
                  fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: '#107c41', color: '#fff', fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(16,124,65,.3)',
                }}>⚙️ Start Processing Data</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== STEP 5: PREVIEW & EDIT ===== */}
      {step === 'preview' && filledData.length > 0 && (
        <div style={{
          background: '#161b27', border: '1px solid #1e2535', borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #1e2535',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 6,
                background: '#0d3d22', color: '#34d399',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
              }}>5</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>Preview & Edit</span>
              <span style={{ fontSize: 12, color: '#4a5568' }}>{filledData.length} rows · {demoHeaders.length} cols</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep('mapping')} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                border: '1px solid #2d3748', cursor: 'pointer',
                background: 'transparent', color: '#9ca3af', fontFamily: 'inherit',
              }}>◀ Back to Mapping</button>
              <button onClick={() => setStep('export')} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: '#107c41', color: '#fff', fontFamily: 'inherit',
              }}>Proceed to Export →</button>
            </div>
          </div>

          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2535', background: '#111827' }}>
            <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
              <span style={{ color: '#34d399' }}>✅ Mapped: {mappedCount}</span>
              <span style={{ color: '#fb923c' }}>📋 From Demo: {missingCols.length}</span>
              <span style={{ color: '#60a5fa' }}>📊 Rows: {filledData.length}</span>
              {sess?.rules?.clientCodeUnique && <span style={{ color: '#a78bfa' }}>🆔 Unique Codes ✓</span>}
            </div>
          </div>

          <div style={{
            overflow: 'auto', maxHeight: '55vh',
            border: '1px solid #1e2535', borderRadius: 8, margin: 12,
          }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%', fontFamily: "'JetBrains Mono', monospace" }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 2, background: '#000' }}>
                  <th style={{
                    padding: '6px 8px', borderRight: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
                    color: '#374151', fontWeight: 400, fontSize: 11,
                    position: 'sticky', left: 0, background: '#000', zIndex: 3, minWidth: 32,
                  }}>#</th>
                  {demoHeaders.map(h => {
                    const isMapped = sess?.colMap?.[h];
                    return (
                      <th key={h} style={{
                        padding: '7px 8px', borderRight: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
                        fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                        color: isMapped ? '#fff' : '#fb923c',
                        background: isMapped ? 'transparent' : 'rgba(251,146,60,0.06)',
                      }} title={isMapped ? `From: ${sess.colMap[h]}` : 'Filled from demo'}>
                        {h} {!isMapped && '📋'}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filledData.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: '1px solid #1e2535' }}>
                    <td style={{
                      padding: '3px 6px', borderRight: '1px solid #1e2535',
                      color: '#374151', fontSize: 11, textAlign: 'center',
                      position: 'sticky', left: 0, background: '#111827', zIndex: 1,
                    }}>{ri + 1}</td>
                    {demoHeaders.map(h => (
                      <td
                        key={h}
                        contentEditable
                        suppressContentEditableWarning
                        style={{
                          padding: '3px 6px', borderRight: '1px solid #1e2535',
                          minWidth: 80, outline: 'none', cursor: 'text',
                          color: row[h] ? '#d1d5db' : '#4a5568',
                          background: sess?.colMap?.[h]
                            ? 'transparent'
                            : 'rgba(251,146,60,0.04)',
                          fontStyle: row[h] ? 'normal' : 'italic',
                        }}
                        onBlur={e => handleCellEdit(ri, h, e.target.innerText)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
                      >{row[h] || '(empty)'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            padding: '8px 16px', borderTop: '1px solid #1e2535',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 11, color: '#4a5568',
          }}>
            <span>Showing all {filledData.length} rows</span>
            <span style={{ color: '#6b7280' }}>Click any cell to edit — all changes are auto-saved</span>
          </div>
        </div>
      )}

      {/* ===== STEP 6: EXPORT ===== */}
      {step === 'export' && filledData.length > 0 && (
        <div style={{
          background: '#161b27', border: '1px solid #1e2535', borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #1e2535',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: 6,
              background: '#0d3d22', color: '#34d399',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
            }}>6</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>Export & Clear Database</span>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{
              marginBottom: 20, padding: 16, borderRadius: 8,
              background: '#0f1117', border: '1px solid #1e2535',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Total Rows', value: filledData.length, color: '#60a5fa' },
                  { label: 'Columns', value: demoHeaders.length, color: '#34d399' },
                  { label: 'DB Status', value: 'Active', color: '#fbbf24' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: 10 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#4a5568', marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: 14, borderRadius: 8, marginBottom: 20,
              background: '#0a1f12', border: '1px solid #064e2e',
              fontSize: 13, color: '#6ee7b7',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>ℹ️</span>
              <span>Downloading the file will <strong style={{ color: '#fb923c' }}>automatically clear the database</strong> for this session. Multiple users can use this simultaneously without conflicts.</span>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={exportExcel} style={{
                padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#107c41,#0e5c30)',
                color: '#fff', fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(16,124,65,.3)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                📊 Download Excel & Clear DB
              </button>
              <button onClick={exportCSV} style={{
                padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                border: '1px solid #2d3748', cursor: 'pointer',
                background: '#1e2535', color: '#e2e8f0', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                📄 Download CSV & Clear DB
              </button>
              <button onClick={() => setStep('preview')} style={{
                padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                border: '1px solid #2d3748', cursor: 'pointer',
                background: 'transparent', color: '#9ca3af', fontFamily: 'inherit',
              }}>◀ Back to Edit</button>
            </div>

            <div style={{
              marginTop: 20, padding: 12, borderRadius: 8,
              background: '#111827', border: '1px solid #1e2535', fontSize: 12, color: '#4a5568',
            }}>
              <strong style={{ color: '#9ca3af' }}>Process Summary:</strong>
              <div style={{ marginTop: 4, lineHeight: 1.8 }}>
                <div>📋 Demo: {currentSession?.demoFileName}</div>
                <div>📦 Source: {currentSession?.sourceFileName}</div>
                <div>🔗 Columns Mapped: {mappedCount}/{demoHeaders.length}</div>
                <div>📋 From Demo: {missingCols.length} columns</div>
                <div>🆔 Unique Codes: {sess?.rules?.clientCodeUnique ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
