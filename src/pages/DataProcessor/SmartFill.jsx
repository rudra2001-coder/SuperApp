import { useState, useRef, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx-js-style';

const STEPS = [
  { key: 'upload-template', num: 1, label: 'Template', icon: '📋' },
  { key: 'upload-data', num: 2, label: 'Data', icon: '📦' },
  { key: 'configure', num: 3, label: 'Configure', icon: '⚙️' },
  { key: 'mapping', num: 4, label: 'Mapping', icon: '🔗' },
  { key: 'preview', num: 5, label: 'Preview', icon: '✏️' },
  { key: 'export', num: 6, label: 'Export', icon: '⬇️' },
];

const COLUMN_MODES = [
  { key: 'auto', label: 'Fill from Source', desc: 'Map & fill from source data', icon: '📥', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { key: 'demo', label: 'Keep Demo Value', desc: 'Use demo row for all rows', icon: '📋', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  { key: 'empty', label: 'Leave Empty', desc: 'Column stays blank', icon: '🚫', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
];

const styles = {
  page: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#f1f5f9',
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 4px',
  },
  glass: {
    background: 'rgba(22,27,39,0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  glassCard: {
    background: 'rgba(15,17,23,0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 14,
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
  },
  accentGradient: 'linear-gradient(135deg, #4361ee, #7c3aed)',
  stepBtn: (enabled, active) => ({
    padding: '8px 18px',
    borderRadius: 100,
    fontSize: 12,
    fontWeight: 600,
    border: 'none',
    cursor: enabled ? 'pointer' : 'default',
    background: active ? 'linear-gradient(135deg, #4361ee, #7c3aed)' : enabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
    color: active ? '#fff' : enabled ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
    opacity: enabled ? 1 : 0.35,
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    letterSpacing: '0.02em',
    position: 'relative',
    overflow: 'hidden',
  }),
  input: {
    padding: '10px 14px',
    fontSize: 13,
    borderRadius: 10,
    background: 'rgba(15,17,23,0.8)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#f1f5f9',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.25s ease',
    width: '100%',
  },
  select: {
    padding: '8px 12px',
    fontSize: 12,
    borderRadius: 8,
    background: 'rgba(15,17,23,0.8)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#f1f5f9',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.25s ease',
    cursor: 'pointer',
  },
  toolBtn: {
    padding: '7px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'inherit',
    transition: 'all 0.25s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  panelHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: 'rgba(67,97,238,0.15)',
    color: '#6c7bff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
    border: '1px solid rgba(67,97,238,0.2)',
  },
  dropZone: (isDrag) => ({
    border: `2px dashed ${isDrag ? '#6c7bff' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 14,
    padding: '44px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    background: isDrag ? 'rgba(67,97,238,0.06)' : 'rgba(15,17,23,0.5)',
    position: 'relative',
    overflow: 'hidden',
  }),
};

const spinKeyframes = `
@keyframes sf-spin { to { transform: rotate(360deg); } }
@keyframes sf-fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes sf-slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes sf-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes sf-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes sf-scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes sf-glow { 0%, 100% { box-shadow: 0 0 20px rgba(67,97,238,0.1); } 50% { box-shadow: 0 0 40px rgba(67,97,238,0.25); } }
`;

function AnimatedSection({ children, style, ...props }) {
  return (
    <div style={{
      animation: 'sf-slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
      ...style,
    }} {...props}>
      {children}
    </div>
  );
}

function NumberTicker({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 600;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <td key={i} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{
            height: 14,
            borderRadius: 6,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
            backgroundSize: '200% 100%',
            animation: 'sf-shimmer 1.5s infinite',
          }} />
        </td>
      ))}
    </tr>
  );
}

export default function SmartFill() {
  const [step, setStep] = useState('upload-template');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [processingLog, setProcessingLog] = useState([]);

  const [demoHeaders, setDemoHeaders] = useState([]);
  const [demoRows, setDemoRows] = useState([]);
  const [demoFileName, setDemoFileName] = useState('');

  const [sourceHeaders, setSourceHeaders] = useState([]);
  const [sourceRows, setSourceRows] = useState([]);
  const [sourceFileName, setSourceFileName] = useState('');

  const [colMap, setColMap] = useState({});
  const [fieldConfig, setFieldConfig] = useState({});
  const [filledData, setFilledData] = useState([]);
  const [mappedCount, setMappedCount] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [dragOverDemo, setDragOverDemo] = useState(false);
  const [dragOverSource, setDragOverSource] = useState(false);

  const [showStats, setShowStats] = useState(false);

  const demoInputRef = useRef(null);
  const sourceInputRef = useRef(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const addLog = (msg) => setProcessingLog(p => [...p, msg]);

  const resetAll = () => {
    setStep('upload-template');
    setDemoHeaders([]);
    setDemoRows([]);
    setDemoFileName('');
    setSourceHeaders([]);
    setSourceRows([]);
    setSourceFileName('');
    setColMap({});
    setFieldConfig({});
    setFilledData([]);
    setMappedCount(0);
    setSourceCount(0);
    setProcessingLog([]);
    setSearchQuery('');
    setSelectedRows(new Set());
    setShowStats(false);
    setNotification(null);
  };

  const readWorkbook = async (file) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
    if (!json.length) throw new Error('No data found in file');
    return { headers: Object.keys(json[0]), rows: json };
  };

  const handleDemoUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    try {
      const { headers, rows } = await readWorkbook(file);
      setDemoHeaders(headers);
      setDemoRows(rows);
      setDemoFileName(file.name);
      const config = {};
      headers.forEach(h => { config[h] = 'auto'; });
      setFieldConfig(config);
      setStep('upload-data');
      showNotif(`Template loaded: ${headers.length} columns, ${rows.length} rows`);
    } catch (err) {
      showNotif('Error: ' + err.message, 'error');
    }
    setLoading(false);
  };

  const handleSourceUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    try {
      const { headers, rows } = await readWorkbook(file);
      setSourceHeaders(headers);
      setSourceRows(rows);
      setSourceFileName(file.name);
      setSourceCount(rows.length);

      const map = {};
      const used = new Set();
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
      setColMap(map);
      setMappedCount(Object.keys(map).length);

      setStep('configure');
      showNotif(`Data loaded: ${headers.length} columns, ${rows.length} rows`);
    } catch (err) {
      showNotif('Error: ' + err.message, 'error');
    }
    setLoading(false);
  };

  const runAutoDetect = () => {
    const map = {};
    const used = new Set();
    demoHeaders.forEach(sh => {
      const sn = sh.toLowerCase().replace(/[\s_\-.]/g, '');
      for (const src of sourceHeaders) {
        const srcn = src.toLowerCase().replace(/[\s_\-.]/g, '');
        if ((sn === srcn || srcn.includes(sn) || sn.includes(srcn)) && !used.has(src)) {
          map[sh] = src;
          used.add(src);
          break;
        }
      }
    });
    setColMap(map);
    setMappedCount(Object.keys(map).length);
    showNotif(`Auto-mapped ${Object.keys(map).length} columns`);
  };

  const processFill = async () => {
    setLoading(true);
    setProcessingLog([]);
    await new Promise(r => setTimeout(r, 400));

    const demoFirstRow = demoRows[0] || {};

    addLog(`Template: ${demoHeaders.length} cols · Data: ${sourceRows.length} rows`);
    addLog(`Modes → Auto-fill: ${autoCount} · Demo: ${demoCount} · Empty: ${emptyCount}`);

    let stats = { fromSource: 0, fromDemo: 0, modeDemo: 0, modeEmpty: 0 };

    let filled = sourceRows.map((srcRow, rowIdx) => {
      const r = {};
      demoHeaders.forEach(h => {
        const mode = fieldConfig[h] || 'auto';

        // MODE: Empty — never fill anything
        if (mode === 'empty') {
          r[h] = '';
          stats.modeEmpty++;
          return;
        }

        // MODE: Demo — always use demo first row value
        if (mode === 'demo') {
          r[h] = demoFirstRow[h] !== undefined ? String(demoFirstRow[h]) : '';
          stats.modeDemo++;
          return;
        }

        // MODE: Auto (Fill from Source) — with demo fallback
        const mapped = colMap[h];
        if (mapped && srcRow[mapped] !== undefined && String(srcRow[mapped]).trim() !== '') {
          r[h] = String(srcRow[mapped]).trim();
          stats.fromSource++;
        } else {
          const dv = demoFirstRow[h];
          r[h] = dv !== undefined && String(dv).trim() !== '' ? String(dv).trim() : '';
          stats.fromDemo++;
          if (rowIdx === 0) addLog(`  "${h}" → source data missing, using demo fallback`);
        }
      });
      return r;
    });

    addLog(`Source data used: ${stats.fromSource} cells`);
    addLog(`Demo fallback:    ${stats.fromDemo} cells`);
    addLog(`Demo mode kept:   ${stats.modeDemo} cells`);
    addLog(`Empty (blank):    ${stats.modeEmpty} cells`);
    addLog(`✅ ${filled.length} rows filled`);

    setFilledData(filled);
    setStep('preview');
    setLoading(false);
    showNotif(`✅ ${filled.length} rows processed`);
  };

  const handleCellEdit = (rowIdx, col, value) => {
    setFilledData(prev => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [col]: value };
      return next;
    });
  };

  const handleInsertRow = (afterIdx) => {
    const empty = {};
    demoHeaders.forEach(h => { empty[h] = ''; });
    setFilledData(prev => {
      const next = [...prev];
      next.splice(afterIdx + 1, 0, empty);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedRows.size) return;
    setFilledData(prev => prev.filter((_, i) => !selectedRows.has(i)));
    setSelectedRows(new Set());
  };

  const handleDuplicateRow = (rowIdx) => {
    setFilledData(prev => {
      const next = [...prev];
      next.splice(rowIdx + 1, 0, { ...next[rowIdx] });
      return next;
    });
  };

  const handleMoveRow = (rowIdx, dir) => {
    const t = rowIdx + dir;
    if (t < 0 || t >= filledData.length) return;
    setFilledData(prev => {
      const next = [...prev];
      const tmp = next[rowIdx];
      next[rowIdx] = next[t];
      next[t] = tmp;
      return next;
    });
  };

  // === EXPORT: Build workbook with every cell forced to text ===
  const buildWorkbook = () => {
    // Build as 2D array first — reliable aoa_to_sheet
    const aoa = [];

    // Row 0: exact demo headers as strings
    aoa.push(demoHeaders.map(h => String(h)));

    // Data rows: every value forced to string
    filledData.forEach(row => {
      const r = [];
      demoHeaders.forEach(h => {
        let val = row[h] !== undefined && row[h] !== null && row[h] !== '' ? String(row[h]).trim() : '';
        r.push(val);
      });
      aoa.push(r);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Force every single cell to text type 's'
    for (let R = 0; R < aoa.length; R++) {
      for (let C = 0; C < demoHeaders.length; C++) {
        const ref = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[ref]) {
          ws[ref].t = 's';
          ws[ref].w = String(ws[ref].v);
          ws[ref].v = String(ws[ref].v);
        }
      }
    }

    // Style header row
    for (let C = 0; C < demoHeaders.length; C++) {
      const ref = XLSX.utils.encode_cell({ r: 0, c: C });
      if (ws[ref]) {
        ws[ref].s = {
          fill: { fgColor: { rgb: '1a1a2e' } },
          font: { color: { rgb: 'FFFFFF' }, bold: true, name: 'Calibri', sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: { bottom: { style: 'thin', color: { rgb: '333333' } } },
        };
      }
    }

    // Style data rows — alternating fill
    for (let R = 1; R < aoa.length; R++) {
      const isEven = R % 2 === 0;
      for (let C = 0; C < demoHeaders.length; C++) {
        const ref = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[ref]) {
          ws[ref].s = {
            font: { name: 'Calibri', sz: 11, color: { rgb: isEven ? '1a1a1a' : '2a2a2a' } },
            alignment: { horizontal: 'left', vertical: 'center' },
            fill: isEven ? { fgColor: { rgb: 'F5F5F5' } } : undefined,
          };
        }
      }
    }

    ws['!cols'] = demoHeaders.map(h => ({ wch: Math.max(Math.min(h.length * 2.2, 40), 14) }));

    const sheetName = (demoFileName || 'Template').replace(/\.[^.]+$/, '').substring(0, 31);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    return wb;
  };

  const exportExcel = () => {
    if (!filledData.length) return;
    try {
      const wb = buildWorkbook();
      const name = (demoFileName || 'template').replace(/\.[^.]+$/, '') + '_Filled.xlsx';
      XLSX.writeFile(wb, name);
      showNotif(`✅ "${name}" — all text, headers preserved`);
    } catch (err) {
      // Fallback: write as binary blob
      try {
        const wb = buildWorkbook();
        const name = (demoFileName || 'template').replace(/\.[^.]+$/, '') + '_Filled.xlsx';
        const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotif(`✅ "${name}" downloaded — all text`);
      } catch (e2) {
        showNotif('Export failed: ' + e2.message, 'error');
      }
    }
  };

  const exportCSV = () => {
    if (!filledData.length) return;
    const escape = (v) => {
      const s = String(v || '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const headerLine = demoHeaders.map(h => escape(h)).join(',');
    const dataLines = filledData.map(r => demoHeaders.map(h => escape(r[h] || '')).join(','));
    const csv = '\uFEFF' + headerLine + '\n' + dataLines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (demoFileName || 'template').replace(/\.[^.]+$/, '') + '_Filled.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotif(`✅ CSV downloaded — headers preserved`);
  };

  const stats = useMemo(() => {
    const s = {};
    demoHeaders.forEach(h => {
      const vals = filledData.map(r => r[h]).filter(v => v !== undefined && v !== '');
      const nums = vals.map(Number).filter(n => !isNaN(n));
      s[h] = {
        total: filledData.length,
        filled: vals.length,
        empty: filledData.length - vals.length,
        unique: new Set(vals).size,
        min: nums.length ? Math.min(...nums) : null,
        max: nums.length ? Math.max(...nums) : null,
      };
    });
    return s;
  }, [filledData]);

  const filtData = useMemo(() => {
    if (!searchQuery) return filledData;
    const q = searchQuery.toLowerCase();
    return filledData.filter(r => demoHeaders.some(h => String(r[h] || '').toLowerCase().includes(q)));
  }, [filledData, searchQuery]);

  const autoCount = Object.entries(fieldConfig).filter(([, v]) => v === 'auto').length;
  const demoCount = Object.entries(fieldConfig).filter(([, v]) => v === 'demo').length;
  const emptyCount = Object.entries(fieldConfig).filter(([, v]) => v === 'empty').length;

  const isStepEnabled = (s) => {
    if (s === 'upload-template') return true;
    if (s === 'upload-data') return demoHeaders.length > 0;
    if (s === 'configure') return sourceHeaders.length > 0;
    if (s === 'mapping') return sourceHeaders.length > 0;
    if (s === 'preview') return filledData.length > 0;
    if (s === 'export') return filledData.length > 0;
    return false;
  };

  const renderDropZone = (type, label, formats, onUpload, isDrag) => (
    <div
      style={{
        ...styles.dropZone(isDrag),
        transform: isDrag ? 'scale(1.02)' : 'scale(1)',
      }}
      onDragOver={e => { e.preventDefault(); type === 'demo' ? setDragOverDemo(true) : setDragOverSource(true); }}
      onDragLeave={() => type === 'demo' ? setDragOverDemo(false) : setDragOverSource(false)}
      onDrop={e => { e.preventDefault(); setDragOverDemo(false); setDragOverSource(false); onUpload(e.dataTransfer.files[0]); }}
      onClick={() => (type === 'demo' ? demoInputRef : sourceInputRef).current?.click()}
    >
      {isDrag && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at center, rgba(67,97,238,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
      )}
      <div style={{
        fontSize: 42,
        marginBottom: 14,
        filter: 'drop-shadow(0 4px 12px rgba(67,97,238,0.2))',
        transition: 'transform 0.3s ease',
        transform: isDrag ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
      }}>
        {type === 'demo' ? '📋' : '📦'}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
        {isDrag ? 'Release to upload' : label}
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 4 }}>
        {formats.map(f => (
          <span key={f} style={{
            padding: '3px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            background: 'rgba(67,97,238,0.12)',
            color: '#6c7bff',
            border: '1px solid rgba(67,97,238,0.15)',
            letterSpacing: '0.03em',
          }}>{f}</span>
        ))}
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <style>{spinKeyframes}</style>

      {/* Notification */}
      {notification && (
        <div style={{
          animation: 'sf-slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
          padding: '12px 20px',
          borderRadius: 12,
          marginBottom: 16,
          fontSize: 13,
          fontWeight: 500,
          background: notification.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)',
          border: `1px solid ${notification.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)'}`,
          color: notification.type === 'error' ? '#f87171' : '#6ee7b7',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: 16 }}>{notification.type === 'error' ? '❌' : '✅'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* ===== NAVIGATOR ===== */}
      <div style={{ ...styles.glass, padding: '18px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #4361ee, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: '#fff',
              boxShadow: '0 4px 16px rgba(67,97,238,0.3)',
            }}>SF</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
                Smart Fill
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                {demoFileName ? `${demoFileName}${sourceFileName ? ` + ${sourceFileName}` : ''}` : 'No template loaded'}
                {demoFileName && sourceFileName && (
                  <span style={{ color: '#6c7bff', marginLeft: 8 }}>●</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={resetAll} style={{
            ...styles.toolBtn,
            borderColor: 'rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.03)',
            fontSize: 12,
          }}>
            🔄 New Session
          </button>
        </div>

        {/* Step trail */}
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          {STEPS.map((s, i) => {
            const enabled = isStepEnabled(s.key);
            const active = step === s.key;
            const done = STEPS.findIndex(x => x.key === step) > i;
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => enabled && setStep(s.key)}
                  style={{
                    ...styles.stepBtn(enabled, active),
                    background: active
                      ? 'linear-gradient(135deg, #4361ee, #7c3aed)'
                      : done
                        ? 'rgba(52,211,153,0.12)'
                        : enabled
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(255,255,255,0.02)',
                    color: active ? '#fff' : done ? '#34d399' : enabled ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                    border: active ? 'none' : done ? '1px solid rgba(52,211,153,0.2)' : '1px solid transparent',
                  }}
                >
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: active ? 'rgba(255,255,255,0.2)' : done ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)',
                    color: active ? '#fff' : done ? '#34d399' : 'rgba(255,255,255,0.3)',
                    fontSize: 10, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {done ? '✓' : s.num}
                  </span>
                  {s.icon} {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <span style={{
                    color: done ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.06)',
                    fontSize: 10, margin: '0 2px',
                    transition: 'color 0.3s',
                  }}>▶</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== STEP 1: UPLOAD TEMPLATE ===== */}
      {step === 'upload-template' && (
        <AnimatedSection>
          <div style={styles.glass}>
            <div style={styles.panelHeader}>
              <span style={styles.stepBadge}>1</span>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Upload Template File</span>
              {demoHeaders.length > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  Loaded
                </span>
              )}
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
                This file defines the <strong style={{ color: '#f1f5f9' }}>exact output structure</strong>.
                Headers will be <strong style={{ color: '#6c7bff' }}>preserved perfectly</strong> in exports.
                The first row serves as demo values for the "Keep Demo Value" mode.
              </p>

              <input ref={demoInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                onChange={e => e.target.files[0] && handleDemoUpload(e.target.files[0])} />

              {renderDropZone('demo', 'Drop template file or click to browse', ['XLSX', 'XLS'], handleDemoUpload, dragOverDemo)}

              {loading && (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{
                    width: 36, height: 36,
                    border: '3px solid rgba(255,255,255,0.06)',
                    borderTopColor: '#6c7bff',
                    borderRadius: '50%',
                    animation: 'sf-spin 0.7s linear infinite',
                    margin: '0 auto 10px',
                  }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Reading template...</span>
                </div>
              )}

              {demoHeaders.length > 0 && (
                <div style={{
                  animation: 'sf-scaleIn 0.3s ease',
                  marginTop: 16,
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: 'rgba(52,211,153,0.06)',
                  border: '1px solid rgba(52,211,153,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  color: '#6ee7b7',
                }}>
                  <span>✅</span>
                  <span style={{ fontWeight: 500 }}>{demoFileName}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>
                    — {demoHeaders.length} columns, {demoRows.length} rows
                  </span>
                </div>
              )}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ===== STEP 2: UPLOAD DATA ===== */}
      {step === 'upload-data' && (
        <AnimatedSection>
          <div style={styles.glass}>
            <div style={styles.panelHeader}>
              <span style={styles.stepBadge}>2</span>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Upload Source Data</span>
              {sourceHeaders.length > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  Loaded
                </span>
              )}
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{
                marginBottom: 20,
                padding: '14px 18px',
                borderRadius: 10,
                background: 'rgba(67,97,238,0.06)',
                border: '1px solid rgba(67,97,238,0.12)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 13,
              }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                  📋 Template: <strong style={{ color: '#f1f5f9' }}>{demoFileName}</strong>
                  <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>{demoHeaders.length} columns</span>
                </span>
                <button onClick={() => setStep('upload-template')} style={styles.toolBtn}>Change</button>
              </div>

              <input ref={sourceInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                onChange={e => e.target.files[0] && handleSourceUpload(e.target.files[0])} />

              {renderDropZone('source', 'Drop data file or click to browse', ['XLSX', 'CSV', 'XLS'], handleSourceUpload, dragOverSource)}

              {loading && (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{
                    width: 36, height: 36,
                    border: '3px solid rgba(255,255,255,0.06)',
                    borderTopColor: '#6c7bff',
                    borderRadius: '50%',
                    animation: 'sf-spin 0.7s linear infinite',
                    margin: '0 auto 10px',
                  }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Reading data...</span>
                </div>
              )}

              {sourceHeaders.length > 0 && (
                <div style={{
                  animation: 'sf-scaleIn 0.3s ease',
                  marginTop: 16,
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: 'rgba(52,211,153,0.06)',
                  border: '1px solid rgba(52,211,153,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  color: '#6ee7b7',
                }}>
                  <span>✅</span>
                  <span style={{ fontWeight: 500 }}>{sourceFileName}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>
                    — {sourceHeaders.length} columns, {sourceCount} rows
                  </span>
                </div>
              )}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ===== STEP 3: CONFIGURE ===== */}
      {step === 'configure' && (
        <AnimatedSection>
          <div style={styles.glass}>
            <div style={{ ...styles.panelHeader, justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={styles.stepBadge}>3</span>
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Configure Columns</span>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
                <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                  {autoCount} auto
                </span>
                <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24' }} />
                  {demoCount} demo
                </span>
                <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6b7280' }} />
                  {emptyCount} empty
                </span>
              </div>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 18, lineHeight: 1.6 }}>
                Choose what happens with each column during filling.
                <strong style={{ color: '#6c7bff', marginLeft: 6 }}>Fill from Source</strong> maps to data,
                <strong style={{ color: '#fbbf24', marginLeft: 6 }}>Keep Demo Value</strong> uses the template's first row,
                <strong style={{ color: '#6b7280', marginLeft: 6 }}>Leave Empty</strong> keeps the column blank.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {demoHeaders.map((h, i) => {
                  const current = fieldConfig[h] || 'auto';
                  return (
                    <div key={h} style={{
                      animation: `sf-slideUp 0.3s ease ${i * 0.03}s both`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 14px',
                      borderRadius: 10,
                      background: 'rgba(15,17,23,0.5)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{
                        flex: '0 0 150px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#f1f5f9',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{h}</div>
                      <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                        {COLUMN_MODES.map(mode => {
                          const isActive = current === mode.key;
                          return (
                            <button
                              key={mode.key}
                              onClick={() => setFieldConfig(prev => ({ ...prev, [h]: mode.key }))}
                              style={{
                                flex: 1,
                                padding: '7px 10px',
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                background: isActive ? mode.bg : 'transparent',
                                border: isActive ? `1px solid ${mode.color}44` : '1px solid rgba(255,255,255,0.04)',
                                color: isActive ? mode.color : 'rgba(255,255,255,0.3)',
                                transition: 'all 0.25s ease',
                                textAlign: 'left',
                              }}
                            >
                              <div style={{ fontSize: 12 }}>{mode.icon} {mode.label}</div>
                              <div style={{ fontSize: 9, marginTop: 2, opacity: isActive ? 0.7 : 0.4 }}>{mode.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep('upload-data')} style={styles.toolBtn}>◀ Back</button>
                <button onClick={() => {
                  if (mappedCount === 0) runAutoDetect();
                  setStep('mapping');
                }} style={{
                  ...styles.toolBtn,
                  background: 'linear-gradient(135deg, #4361ee, #7c3aed)',
                  border: 'none',
                  color: '#fff',
                  padding: '7px 20px',
                  boxShadow: '0 4px 16px rgba(67,97,238,0.25)',
                }}>Continue →</button>
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ===== STEP 4: MAPPING ===== */}
      {step === 'mapping' && (
        <AnimatedSection>
          <div style={styles.glass}>
            <div style={{ ...styles.panelHeader, justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={styles.stepBadge}>4</span>
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Column Mapping</span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(67,97,238,0.1)',
                  color: '#6c7bff',
                  border: '1px solid rgba(67,97,238,0.15)',
                }}>{mappedCount}/{demoHeaders.length} mapped</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={runAutoDetect} style={styles.toolBtn}>🔄 Auto-Detect</button>
                <button
                  onClick={() => {
                    setStep('processing');
                    processFill();
                  }}
                  disabled={mappedCount === 0}
                  style={{
                    ...styles.toolBtn,
                    background: mappedCount > 0 ? 'linear-gradient(135deg, #4361ee, #7c3aed)' : 'rgba(255,255,255,0.03)',
                    border: 'none',
                    color: '#fff',
                    opacity: mappedCount > 0 ? 1 : 0.4,
                    cursor: mappedCount > 0 ? 'pointer' : 'default',
                    boxShadow: mappedCount > 0 ? '0 4px 16px rgba(67,97,238,0.25)' : 'none',
                  }}
                >⚙️ Process →</button>
              </div>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                display: 'flex',
                gap: 16,
              }}>
                <span style={{ color: '#34d399' }}>📥 Auto: {autoCount}</span>
                <span style={{ color: '#fbbf24' }}>📋 Demo: {demoCount}</span>
                <span style={{ color: '#6b7280' }}>🚫 Empty: {emptyCount}</span>
                <span style={{ marginLeft: 'auto', color: '#6c7bff' }}>
                  Only auto columns need mapping
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 6 }}>
                {demoHeaders.map((h, i) => {
                  const mode = fieldConfig[h] || 'auto';
                  const mapped = colMap[h];
                  const isActive = mode === 'auto';
                  return (
                    <div key={h} style={{
                      animation: `sf-slideUp 0.25s ease ${i * 0.02}s both`,
                      display: 'grid',
                      gridTemplateColumns: '1fr 20px 1fr',
                      gap: 6,
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(15,17,23,0.5)',
                      border: !isActive ? '1px solid rgba(255,255,255,0.03)'
                        : mapped ? '1px solid rgba(67,97,238,0.15)' : '1px solid rgba(255,255,255,0.04)',
                      opacity: isActive ? 1 : 0.5,
                      transition: 'all 0.2s',
                    }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600,
                        color: mode === 'auto' ? '#f1f5f9' : mode === 'demo' ? '#fbbf24' : '#6b7280',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        {h}
                        {mode !== 'auto' && (
                          <span style={{ fontSize: 10, opacity: 0.6 }}>{mode === 'demo' ? '📋' : '🚫'}</span>
                        )}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.15)', textAlign: 'center', fontSize: 11 }}>→</div>
                      {isActive ? (
                        <select
                          value={mapped || ''}
                          onChange={e => {
                            const nm = { ...colMap, [h]: e.target.value };
                            setColMap(nm);
                            setMappedCount(Object.keys(nm).length);
                          }}
                          style={styles.select}
                        >
                          <option value="">— not mapped —</option>
                          {sourceHeaders.map(src => (
                            <option key={src} value={src}>{src}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{
                          fontSize: 11,
                          color: mode === 'demo' ? '#fbbf24' : '#6b7280',
                          padding: '4px 6px',
                          fontStyle: 'italic',
                        }}>
                          {mode === 'demo' ? 'Demo value' : 'Empty'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button onClick={() => setStep('configure')} style={styles.toolBtn}>◀ Configure</button>
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ===== STEP 5: PREVIEW ===== */}
      {step === 'preview' && filledData.length > 0 && (
        <AnimatedSection>
          <div style={styles.glass}>
            <div style={{ ...styles.panelHeader, justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={styles.stepBadge}>5</span>
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Preview</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                  {filledData.length} rows · {demoHeaders.length} cols
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowStats(!showStats)} style={{
                  ...styles.toolBtn,
                  background: showStats ? 'rgba(67,97,238,0.12)' : 'rgba(255,255,255,0.04)',
                  borderColor: showStats ? 'rgba(67,97,238,0.2)' : 'rgba(255,255,255,0.08)',
                  color: showStats ? '#6c7bff' : 'rgba(255,255,255,0.7)',
                }}>📊 Stats</button>
                <button onClick={() => setStep('mapping')} style={styles.toolBtn}>◀ Mapping</button>
                <button onClick={() => setStep('export')} style={{
                  ...styles.toolBtn,
                  background: 'linear-gradient(135deg, #4361ee, #7c3aed)',
                  border: 'none',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(67,97,238,0.25)',
                }}>Export →</button>
              </div>
            </div>

            {/* Stats */}
            {showStats && (
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: 'rgba(15,17,23,0.5)',
                animation: 'sf-slideUp 0.2s ease',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Column Statistics
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%', minWidth: 500 }}>
                    <thead>
                      <tr style={{ color: 'rgba(255,255,255,0.3)' }}>
                        <th style={{ padding: '4px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'left' }}>Column</th>
                        <th style={{ padding: '4px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>Total</th>
                        <th style={{ padding: '4px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>Filled</th>
                        <th style={{ padding: '4px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>Empty</th>
                        <th style={{ padding: '4px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>Unique</th>
                        <th style={{ padding: '4px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>Min</th>
                        <th style={{ padding: '4px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demoHeaders.map(h => {
                        const s = stats[h];
                        return (
                          <tr key={h}>
                            <td style={{ padding: '3px 10px', borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#f1f5f9', fontWeight: 500 }}>{h}</td>
                            <td style={{ padding: '3px 10px', borderBottom: '1px solid rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{s?.total || 0}</td>
                            <td style={{ padding: '3px 10px', borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#34d399', textAlign: 'center' }}>{s?.filled || 0}</td>
                            <td style={{ padding: '3px 10px', borderBottom: '1px solid rgba(255,255,255,0.02)', color: (s?.empty || 0) > 0 ? '#fb923c' : 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{s?.empty || 0}</td>
                            <td style={{ padding: '3px 10px', borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#a78bfa', textAlign: 'center' }}>{s?.unique || 0}</td>
                            <td style={{ padding: '3px 10px', borderBottom: '1px solid rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{s?.min !== null ? s.min : '—'}</td>
                            <td style={{ padding: '3px 10px', borderBottom: '1px solid rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{s?.max !== null ? s.max : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: 'rgba(15,17,23,0.3)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 Search across columns..."
                style={{
                  ...styles.input,
                  flex: 1,
                  minWidth: 160,
                  padding: '8px 12px',
                  fontSize: 12,
                }}
              />
              <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.06)' }} />
              <button
                onClick={handleDeleteSelected}
                disabled={!selectedRows.size}
                style={{
                  ...styles.toolBtn,
                  borderColor: selectedRows.size ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
                  color: selectedRows.size ? '#f87171' : 'rgba(255,255,255,0.3)',
                  opacity: selectedRows.size ? 1 : 0.5,
                  cursor: selectedRows.size ? 'pointer' : 'default',
                }}
              >🗑️ Delete ({selectedRows.size})</button>
              <button
                onClick={() => {
                  if (selectedRows.size === filledData.length) setSelectedRows(new Set());
                  else setSelectedRows(new Set(filledData.map((_, i) => i)));
                }}
                style={styles.toolBtn}
              >
                {selectedRows.size === filledData.length ? '☐ Deselect' : '☑ Select All'}
              </button>
              {searchQuery && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {filtData.length}/{filledData.length}
                </span>
              )}
            </div>

            {/* Info bar */}
            <div style={{
              padding: '8px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.3)',
              display: 'flex',
              gap: 16,
              background: 'rgba(15,17,23,0.2)',
            }}>
              <span style={{ color: '#34d399' }}>📥 {autoCount} auto</span>
              <span style={{ color: '#fbbf24' }}>📋 {demoCount} demo</span>
              <span style={{ color: '#6b7280' }}>🚫 {emptyCount} empty</span>
              <span style={{ marginLeft: 'auto' }}>✏️ Click to edit · Enter to save · Tab to navigate</span>
            </div>

            {/* Table */}
            <div style={{
              overflow: 'auto',
              maxHeight: '50vh',
              margin: 12,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <table style={{
                borderCollapse: 'collapse',
                fontSize: 12,
                width: '100%',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 2, background: '#0d0f17' }}>
                    <th style={{
                      padding: '8px 4px', borderRight: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.3)', fontWeight: 500, fontSize: 11,
                      position: 'sticky', left: 0, background: '#0d0f17', zIndex: 3, minWidth: 28,
                    }}>
                      <input type="checkbox"
                        onChange={() => {
                          if (selectedRows.size === filledData.length) setSelectedRows(new Set());
                          else setSelectedRows(new Set(filledData.map((_, i) => i)));
                        }}
                        checked={selectedRows.size === filledData.length && filledData.length > 0}
                        style={{ accentColor: '#4361ee', cursor: 'pointer' }} />
                    </th>
                    <th style={{
                      padding: '8px 6px', borderRight: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.3)', fontWeight: 500, fontSize: 11,
                      position: 'sticky', left: 28, background: '#0d0f17', zIndex: 3, minWidth: 32,
                    }}>#</th>
                    {demoHeaders.map(h => {
                      const mode = fieldConfig[h] || 'auto';
                      return (
                        <th key={h} style={{
                          padding: '8px 10px',
                          borderRight: '1px solid rgba(255,255,255,0.03)',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          fontSize: 11,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          color: mode === 'auto' ? '#f1f5f9' : mode === 'demo' ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                          letterSpacing: '0.02em',
                        }}>
                          {h}
                          <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.5 }}>
                            {mode === 'auto' ? '📥' : mode === 'demo' ? '📋' : '🚫'}
                          </span>
                        </th>
                      );
                    })}
                    <th style={{
                      padding: '8px 6px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.2)', fontWeight: 500, fontSize: 11, minWidth: 80,
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtData.length === 0 ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={demoHeaders.length} />)
                  ) : (
                    filtData.map((row, ri) => {
                      const actualIdx = filledData.indexOf(row);
                      return (
                        <tr key={ri} style={{
                          borderBottom: '1px solid rgba(255,255,255,0.02)',
                          background: selectedRows.has(actualIdx) ? 'rgba(67,97,238,0.06)' : ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
                          transition: 'background 0.15s',
                        }}>
                          <td style={{
                            padding: '5px 4px', borderRight: '1px solid rgba(255,255,255,0.02)',
                            position: 'sticky', left: 0,
                            background: selectedRows.has(actualIdx) ? 'rgba(67,97,238,0.06)' : '#111827', zIndex: 1,
                          }}>
                            <input type="checkbox" checked={selectedRows.has(actualIdx)}
                              onChange={() => {
                                const n = new Set(selectedRows);
                                n.has(actualIdx) ? n.delete(actualIdx) : n.add(actualIdx);
                                setSelectedRows(n);
                              }}
                              style={{ accentColor: '#4361ee', cursor: 'pointer' }} />
                          </td>
                          <td style={{
                            padding: '5px 6px', borderRight: '1px solid rgba(255,255,255,0.02)',
                            color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center',
                            position: 'sticky', left: 28,
                            background: selectedRows.has(actualIdx) ? 'rgba(67,97,238,0.06)' : '#111827', zIndex: 1,
                          }}>{actualIdx !== undefined ? actualIdx + 1 : ri + 1}</td>
                          {demoHeaders.map(h => {
                            const val = row[h] !== undefined && row[h] !== '' ? row[h] : '';
                            return (
                              <td key={h}
                                contentEditable
                                suppressContentEditableWarning
                                style={{
                                  padding: '5px 10px',
                                  borderRight: '1px solid rgba(255,255,255,0.02)',
                                  minWidth: 90,
                                  outline: 'none',
                                  cursor: 'text',
                                  color: val ? '#e2e8f0' : 'rgba(255,255,255,0.2)',
                                  fontStyle: val ? 'normal' : 'italic',
                                  transition: 'background 0.15s',
                                }}
                                onBlur={e => handleCellEdit(actualIdx, h, e.target.innerText)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
                                  if (e.key === 'Tab') { e.preventDefault(); const next = e.target.closest('td')?.nextElementSibling; if (next?.tagName === 'TD') next.focus(); }
                                }}
                              >{val || '(empty)'}</td>
                            );
                          })}
                          <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>
                            {[
                              { fn: () => handleInsertRow(actualIdx), label: '➕', title: 'Insert' },
                              { fn: () => handleDuplicateRow(actualIdx), label: '📋', title: 'Duplicate' },
                              { fn: () => handleMoveRow(actualIdx, -1), label: '↑', title: 'Up' },
                              { fn: () => handleMoveRow(actualIdx, 1), label: '↓', title: 'Down' },
                            ].map(a => (
                              <button key={a.label} onClick={a.fn} title={a.title} style={{
                                padding: '2px 6px', borderRadius: 4, fontSize: 10,
                                border: 'none', cursor: 'pointer',
                                background: 'transparent', color: 'rgba(255,255,255,0.3)',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                              }}>{a.label}</button>
                            ))}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{
              padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 11, color: 'rgba(255,255,255,0.3)',
            }}>
              <span>
                {searchQuery ? `${filtData.length} of ${filledData.length} rows` : `${filledData.length} rows`}
                {selectedRows.size > 0 && ` · ${selectedRows.size} selected`}
              </span>
              <span>All values export as text · Headers preserved</span>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ===== STEP 6: EXPORT ===== */}
      {step === 'export' && filledData.length > 0 && (
        <AnimatedSection>
          <div style={styles.glass}>
            <div style={styles.panelHeader}>
              <span style={styles.stepBadge}>6</span>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Export</span>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              {/* Summary cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 20,
              }}>
                {[
                  { label: 'Total Rows', value: filledData.length, color: '#6c7bff' },
                  { label: 'Columns', value: demoHeaders.length, color: '#34d399' },
                  { label: 'Auto-fill', value: autoCount, color: '#34d399' },
                  { label: 'Demo/Empty', value: demoCount + emptyCount, color: '#fbbf24' },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '16px',
                    borderRadius: 10,
                    background: 'rgba(15,17,23,0.5)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: s.color,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      <NumberTicker value={s.value} />
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, letterSpacing: '0.03em' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Export info */}
              <div style={{
                padding: '14px 18px',
                borderRadius: 10,
                marginBottom: 20,
                background: 'rgba(67,97,238,0.06)',
                border: '1px solid rgba(67,97,238,0.12)',
                fontSize: 13,
                color: '#93a3ff',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <span>
                  <strong>Format preserved.</strong> All cell values export as <strong style={{ color: '#f1f5f9' }}>text</strong> —
                  no formulas, no auto-number, no date conversion.
                  Headers match your template <strong style={{ color: '#f1f5f9' }}>exactly</strong>.
                </span>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={exportExcel} style={{
                  padding: '14px 32px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: 'linear-gradient(135deg, #4361ee, #7c3aed)',
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(67,97,238,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.25s ease',
                  letterSpacing: '0.01em',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(67,97,238,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(67,97,238,0.3)'; }}
                >
                  📊 Download Excel
                </button>
                <button onClick={exportCSV} style={{
                  padding: '14px 28px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.25s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                >
                  📄 Download CSV
                </button>
                <button onClick={() => setStep('preview')} style={{
                  padding: '14px 20px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.5)',
                  transition: 'all 0.25s ease',
                }}>◀ Back</button>
              </div>

              {/* Summary */}
              <div style={{
                marginTop: 20,
                padding: '14px 18px',
                borderRadius: 10,
                background: 'rgba(15,17,23,0.5)',
                border: '1px solid rgba(255,255,255,0.03)',
                fontSize: 12,
                color: 'rgba(255,255,255,0.35)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Export Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 24px' }}>
                  <span>📋 Template: {demoFileName}</span>
                  <span>📦 Data: {sourceFileName}</span>
                  <span style={{ color: '#34d399' }}>📥 Auto-fill: {autoCount} columns</span>
                  <span style={{ color: '#fbbf24' }}>📋 Demo values: {demoCount} columns</span>
                  <span style={{ color: '#6b7280' }}>🚫 Empty: {emptyCount} columns</span>
                  <span>📊 Rows: {filledData.length}</span>
                  <span style={{ color: '#6c7bff' }}>🔤 All values: Text format</span>
                  <span style={{ color: '#6c7bff' }}>📋 Headers: Preserved from template</span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Processing overlay */}
      {step === 'processing' && loading && (
        <AnimatedSection>
          <div style={{ ...styles.glass, textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              <div style={{
                width: 52, height: 52,
                border: '3px solid rgba(255,255,255,0.06)',
                borderTopColor: '#6c7bff',
                borderRadius: '50%',
                animation: 'sf-spin 0.8s linear infinite',
                margin: '0 auto',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(67,97,238,0.15) 0%, transparent 70%)',
              }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
              Processing...
            </div>
            <div style={{
              background: 'rgba(15,17,23,0.8)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 10,
              padding: '14px 18px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: '#6c7bff',
              maxHeight: 150,
              overflowY: 'auto',
              width: '100%',
              maxWidth: 480,
              margin: '0 auto',
              textAlign: 'left',
            }}>
              {processingLog.map((l, i) => (
                <div key={i} style={{ padding: '2px 0' }}>{'>'} {l}</div>
              ))}
              <div style={{ animation: 'sf-pulse 1.5s infinite', color: 'rgba(108,123,255,0.5)' }}>{'>'} Applying...</div>
            </div>
          </div>
        </AnimatedSection>
      )}
    </div>
  );
}
