import { useState, useRef, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx-js-style';
import CopyButton from '../../components/common/CopyButton';

const SEVERITY_COLORS = {
  error: { bg: 'rgba(239,71,111,0.12)', text: '#ef476f', border: 'rgba(239,71,111,0.3)' },
  warning: { bg: 'rgba(255,209,102,0.12)', text: '#ffd166', border: 'rgba(255,209,102,0.3)' },
  info: { bg: 'rgba(67,181,129,0.12)', text: '#43b581', border: 'rgba(67,181,129,0.3)' },
};

const COMMON_PATTERNS = {
  email: /^[\w.+-]+@[\w-]+\.[\w.-]+$/,
  url: /^https?:\/\//,
  phone: /^[\+]?[\d\s\-\(\)]{7,20}$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  hexColor: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
  ipAddress: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  percentage: /^\d+(\.\d+)?%$/,
  currency: /^[\$\€\£\¥]\d+(\.\d{1,2})?$/,
};

function inferType(values) {
  const nonEmpty = values.filter(v => v !== undefined && v !== null && v !== '');
  if (nonEmpty.length === 0) return { type: 'any', confidence: 0 };
  const scores = {};
  nonEmpty.forEach(v => {
    const str = String(v);
    if (typeof v === 'number') { scores.number = (scores.number || 0) + 1; return; }
    if (v instanceof Date) { scores.date = (scores.date || 0) + 1; return; }
    if (typeof v === 'boolean') { scores.boolean = (scores.boolean || 0) + 1; return; }
    if (COMMON_PATTERNS.email.test(str)) { scores.email = (scores.email || 0) + 1; return; }
    if (COMMON_PATTERNS.url.test(str)) { scores.url = (scores.url || 0) + 1; return; }
    if (COMMON_PATTERNS.phone.test(str)) { scores.phone = (scores.phone || 0) + 1; return; }
    if (COMMON_PATTERNS.zipCode.test(str)) { scores.zipCode = (scores.zipCode || 0) + 1; return; }
    if (COMMON_PATTERNS.hexColor.test(str)) { scores.hexColor = (scores.hexColor || 0) + 1; return; }
    if (COMMON_PATTERNS.ipAddress.test(str)) { scores.ipAddress = (scores.ipAddress || 0) + 1; return; }
    if (COMMON_PATTERNS.percentage.test(str)) { scores.percentage = (scores.percentage || 0) + 1; return; }
    if (COMMON_PATTERNS.currency.test(str)) { scores.currency = (scores.currency || 0) + 1; return; }
    if (!isNaN(new Date(str).getTime()) && /^\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(str)) { scores.date = (scores.date || 0) + 1; return; }
    if (/^\d{10,}$/.test(str)) { scores.numeric_text = (scores.numeric_text || 0) + 1; return; }
    scores.text = (scores.text || 0) + 1;
  });
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  const confidence = top[1] / nonEmpty.length;
  return { type: top[0], confidence, candidates: entries.slice(0, 3) };
}

function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: true });
        const sheetNames = workbook.SheetNames;
        const sheets = sheetNames.map(name => {
          const sheet = workbook.Sheets[name];
          const json = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 });
          return { name, sheet, json };
        });
        resolve({ workbook, sheets, sheetNames, raw: data, fileName: file.name });
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function analyzeDemo(demoJson, sheetName) {
  if (demoJson.length < 2) return { error: 'Need at least a header row and one data row' };
  const headers = demoJson[0].map(h => String(h || '').trim()).filter(Boolean);
  if (headers.length === 0) return { error: 'No headers found' };
  const dataRows = demoJson.slice(1).filter(r => r.some(c => c !== '' && c !== undefined && c !== null));
  if (dataRows.length === 0) return { error: 'No data rows found' };
  const schema = headers.map((name, colIdx) => {
    const values = dataRows.map(r => r[colIdx]);
    const nonEmpty = values.filter(v => v !== undefined && v !== null && v !== '');
    const inferred = inferType(values);
    const required = nonEmpty.length === values.length && values.length > 3;
    const uniqueVals = [...new Set(nonEmpty.map(v => String(v).toLowerCase()))];
    const enumValues = uniqueVals.length <= 25 ? uniqueVals : [];
    const examples = nonEmpty.slice(0, 3);
    const nullCount = values.filter(v => v === undefined || v === null || v === '').length;
    const duplicateCount = values.length - [...new Set(values.map(v => String(v).toLowerCase()))].length;
    return {
      name, colIdx, type: inferred.type, confidence: inferred.confidence, typeCandidates: inferred.candidates,
      required, enumValues, examples, totalRows: dataRows.length, filledRows: nonEmpty.length,
      nullCount, duplicateCount, uniqueCount: uniqueVals.length,
    };
  });
  return { headers, schema, rowCount: dataRows.length, sheetName };
}

function validateSource(sourceJson, analysis, rules, columnMap) {
  if (sourceJson.length < 1) return { error: 'Source file is empty' };
  const srcHeaders = sourceJson[0].map(h => String(h || '').trim());
  const srcDataRows = sourceJson.slice(1).filter(r => r.some(c => c !== '' && c !== undefined && c !== null));
  const issues = [];

  const headerMap = {};
  srcHeaders.forEach((h, i) => { if (h) headerMap[h] = i; });

  const { headers: demoHeaders, schema } = analysis;

  demoHeaders.forEach(dh => {
    const mapped = columnMap?.[dh] || dh;
    if (!(mapped in headerMap) && !columnMap?.[dh]) {
      const suggestions = Object.keys(headerMap).filter(h =>
        h.toLowerCase().includes(dh.toLowerCase()) || dh.toLowerCase().includes(h.toLowerCase()) ||
        h.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === dh.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      );
      issues.push({
        type: 'missing_column', severity: 'error', field: dh,
        message: `Column "${dh}" not found in source`,
        expected: dh, actual: '(not found)', suggestions,
        resolution: suggestions.length ? `Try mapping: "${dh}" → "${suggestions[0]}"` : 'Add the missing column to source file',
        row: 'Header',
      });
    }
  });

  srcHeaders.forEach(sh => {
    const isMapped = Object.values(columnMap || {}).includes(sh);
    if (sh && !demoHeaders.includes(sh) && !demoHeaders.some(dh => columnMap?.[dh] === sh) && !isMapped) {
      issues.push({
        type: 'extra_column', severity: 'warning', field: sh,
        message: `Unexpected column "${sh}" not in template`,
        expected: '(not in demo)', actual: sh, resolution: 'Remove or ignore this column', row: 'Header',
      });
    }
  });

  srcDataRows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 2;
    schema.forEach(col => {
      const mappedCol = columnMap?.[col.name] || col.name;
      const srcColIdx = headerMap[mappedCol];
      if (srcColIdx === undefined) return;
      const val = row[srcColIdx];
      const strVal = String(val ?? '');
      const isEmpty = val === undefined || val === null || val === '';

      if (rules.checkRequired && col.required && isEmpty) {
        const example = col.examples[0] || '(empty)';
        issues.push({
          type: 'required_field', severity: 'error', field: col.name, row: rowNum,
          message: `Row ${rowNum}: "${col.name}" is required but empty`,
          expected: example, actual: '(empty)',
          resolution: `Provide a value like "${example}"`,
        });
      }

      if (isEmpty) return;

      if (rules.checkTypes && col.type === 'number' && isNaN(Number(val))) {
        issues.push({
          type: 'type_mismatch', severity: 'error', field: col.name, row: rowNum,
          message: `Row ${rowNum}: "${col.name}" should be a number, got "${strVal}"`,
          expected: `e.g. ${col.examples[0] || '0'}`, actual: strVal,
          resolution: col.examples[0] ? `Change "${strVal}" to a number like ${col.examples[0]}` : 'Enter a numeric value',
        });
      }

      if (rules.checkFormats && col.type === 'email' && !COMMON_PATTERNS.email.test(strVal)) {
        issues.push({
          type: 'invalid_format', severity: 'error', field: col.name, row: rowNum,
          message: `Row ${rowNum}: "${col.name}" is not a valid email`, expected: `e.g. ${col.examples[0] || 'user@example.com'}`, actual: strVal,
          resolution: `Fix the email format in row ${rowNum}`,
        });
      }

      if (rules.checkFormats && col.type === 'url' && !COMMON_PATTERNS.url.test(strVal)) {
        issues.push({
          type: 'invalid_format', severity: 'error', field: col.name, row: rowNum,
          message: `Row ${rowNum}: "${col.name}" is not a valid URL`, expected: `e.g. ${col.examples[0] || 'https://...'}`, actual: strVal,
        });
      }

      if (rules.checkFormats && col.type === 'date') {
        const d = new Date(val);
        if (isNaN(d.getTime()) && !/^\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(strVal)) {
          issues.push({
            type: 'invalid_format', severity: 'error', field: col.name, row: rowNum,
            message: `Row ${rowNum}: "${col.name}" is not a valid date`, expected: `e.g. ${col.examples[0] || '2024-01-15'}`, actual: strVal,
          });
        }
      }

      if (rules.checkFormats && col.type === 'phone' && !COMMON_PATTERNS.phone.test(strVal)) {
        issues.push({
          type: 'invalid_format', severity: 'warning', field: col.name, row: rowNum,
          message: `Row ${rowNum}: "${col.name}" may not be a valid phone number`, expected: `e.g. ${col.examples[0] || '+1 555-123-4567'}`, actual: strVal,
        });
      }

      if (rules.checkEnums && col.enumValues.length > 0 && !col.enumValues.includes(strVal.toLowerCase())) {
        const allowed = col.enumValues.slice(0, 5);
        const closest = col.enumValues.find(e => e.includes(strVal.toLowerCase()) || strVal.toLowerCase().includes(e));
        issues.push({
          type: 'invalid_value', severity: 'warning', field: col.name, row: rowNum,
          message: `Row ${rowNum}: "${col.name}" has unexpected value "${strVal}"`,
          expected: `One of: ${allowed.join(', ')}${col.enumValues.length > 5 ? ` (+${col.enumValues.length - 5} more)` : ''}`,
          actual: strVal,
          resolution: closest ? `Did you mean "${closest}"?` : `Use one of the allowed values`,
        });
      }

      if (rules.checkDuplicates && col.duplicateCount > col.totalRows * 0.8 && col.uniqueCount < 5) {
        const count = srcDataRows.filter(r => String(r[srcColIdx] ?? '').toLowerCase() === strVal.toLowerCase()).length;
        if (count > 1) {
          issues.push({
            type: 'duplicate_value', severity: 'info', field: col.name, row: rowNum,
            message: `Row ${rowNum}: "${col.name}" value "${strVal}" appears ${count} times`,
            expected: 'Unique values preferred', actual: `${count} occurrences`,
          });
        }
      }
    });
  });

  const totalChecks = srcDataRows.length * schema.length;
  const stats = {
    totalRows: srcDataRows.length,
    totalChecks,
    totalIssues: issues.length,
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    infos: issues.filter(i => i.severity === 'info').length,
    rowsWithIssues: [...new Set(issues.filter(i => i.row !== 'Header').map(i => i.row))].length,
    passRate: totalChecks > 0 ? ((totalChecks - issues.length) / totalChecks * 100).toFixed(1) : 100,
    byType: issues.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {}),
    byField: issues.reduce((acc, i) => { acc[i.field] = (acc[i.field] || 0) + 1; return acc; }, {}),
  };

  return { issues, stats };
}

function exportReport(issues, stats, demoFileName, srcFileName, format) {
  const rows = issues.map(i => ({
    Type: i.type, Severity: i.severity, Row: i.row, Field: i.field,
    Message: i.message, 'Expected Value': i.expected, 'Actual Value': i.actual,
    Resolution: i.resolution || '',
  }));

  if (format === 'json') {
    const blob = new Blob([JSON.stringify({ statistics: stats, issues: rows }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `validation-report-${srcFileName.replace(/\.[^.]+$/, '')}.json`; a.click();
    URL.revokeObjectURL(url);
    return;
  }

  if (format === 'csv') {
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `validation-report-${srcFileName.replace(/\.[^.]+$/, '')}.csv`; a.click();
    URL.revokeObjectURL(url);
    return;
  }

  if (format === 'html') {
    const severityIcon = (s) => s === 'error' ? '❌' : s === 'warning' ? '⚠️' : 'ℹ️';
    const rowsHtml = rows.map(r => `<tr style="${r.Severity === 'error' ? 'background:#fff0f0' : r.Severity === 'warning' ? 'background:#fffdf0' : ''}">
      <td>${r.Row}</td><td>${r.Field}</td><td>${severityIcon(r.Severity)} ${r.Severity}</td><td>${r.Message}</td><td>${r['Expected Value']}</td><td>${r['Actual Value']}</td>
    </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Validation Report</title>
      <style>body{font-family:sans-serif;margin:20px;color:#333}h1{font-size:18px}
      table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
      th{background:#f5f5f5;font-weight:600}.summary{display:flex;gap:16px;margin:16px 0}.stat{background:#f9f9f9;padding:12px 16px;border-radius:8px;flex:1;text-align:center}.stat-num{font-size:24px;font-weight:700}.stat-label{font-size:11px;color:#666}</style></head><body>
      <h1>📊 Excel Validation Report</h1>
      <p>Demo: ${demoFileName} | Source: ${srcFileName} | ${stats.totalRows} rows checked | ${stats.totalIssues} issues</p>
      <div class="summary">
        <div class="stat"><div class="stat-num" style="color:#ef476f">${stats.errors}</div><div class="stat-label">Errors</div></div>
        <div class="stat"><div class="stat-num" style="color:#ffd166">${stats.warnings}</div><div class="stat-label">Warnings</div></div>
        <div class="stat"><div class="stat-num" style="color:#43b581">${stats.infos}</div><div class="stat-label">Info</div></div>
        <div class="stat"><div class="stat-num" style="color:#666">${stats.passRate}%</div><div class="stat-label">Pass Rate</div></div>
      </div>
      <table><thead><tr><th>Row</th><th>Field</th><th>Severity</th><th>Message</th><th>Expected</th><th>Actual</th></tr></thead><tbody>${rowsHtml}</tbody></table>
      </body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `validation-report-${srcFileName.replace(/\.[^.]+$/, '')}.html`; a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Validation Report');
  ws['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 18 }, { wch: 60 }, { wch: 30 }, { wch: 30 }, { wch: 40 }];
  XLSX.writeFile(wb, `validation-report-${srcFileName.replace(/\.[^.]+$/, '')}.xlsx`);
}

function generateFilledTemplate(schema) {
  const exampleValues = {
    number: '42', email: 'user@example.com', url: 'https://example.com', date: '2024-01-15',
    phone: '+1 555-123-4567', text: 'Sample text', boolean: 'Yes', zipCode: '12345',
    hexColor: '#ff0000', ipAddress: '192.168.1.1', percentage: '75%', currency: '$99.99',
    numeric_text: '1234567890', any: 'Value',
  };
  const headers = schema.map(c => c.name);
  const row = schema.map(c => exampleValues[c.type] || 'Value');
  return { headers, data: [row] };
}

const GROUP_OPTIONS = [
  { value: 'none', label: 'Flat List' },
  { value: 'field', label: 'Group by Field' },
  { value: 'type', label: 'Group by Type' },
  { value: 'severity', label: 'Group by Severity' },
];

function FileDropzone({ label, icon, file, onFile, onRemove, accept }) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef(null);

  return (
    <div
      style={{
        padding: '20px 16px', borderRadius: 'var(--radius)',
        border: `2px dashed ${dragging ? 'var(--accent)' : file ? 'var(--success)' : 'var(--border-color)'}`,
        borderColor: dragging ? 'var(--accent)' : file ? 'var(--success)' : 'var(--border-color)',
        textAlign: 'center', cursor: 'pointer',
        transition: 'all 0.2s', background: dragging ? 'rgba(99,102,241,0.05)' : 'transparent',
      }}
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
    >
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; if (f) onFile(f); }} />
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        {file ? `✅ ${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'Click or drag & drop'}
      </div>
      {file && (
        <button className="btn-sm" style={{ marginTop: 8, color: 'var(--danger)', background: 'transparent', border: '1px solid rgba(239,71,111,0.3)' }}
          onClick={e => { e.stopPropagation(); onRemove(); }}>Remove</button>
      )}
    </div>
  );
}

function Bar({ value, max, color, height = 6, label }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {label && <span style={{ fontSize: 11, minWidth: 60, color: 'var(--text-secondary)' }}>{label}</span>}
      <div style={{ flex: 1, height, borderRadius: 3, background: 'var(--border-color)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, minWidth: 30, textAlign: 'right', color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const colors = SEVERITY_COLORS[severity] || SEVERITY_COLORS.info;
  const icon = severity === 'error' ? '✕' : severity === 'warning' ? '⚠' : 'ℹ';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
      background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
      textTransform: 'capitalize',
    }}>
      {icon} {severity}
    </span>
  );
}

export default function ExcelValidator() {
  const [demoFile, setDemoFile] = useState(null);
  const [srcFile, setSrcFile] = useState(null);
  const [demoParsed, setDemoParsed] = useState(null);
  const [srcParsed, setSrcParsed] = useState(null);
  const [demoSheet, setDemoSheet] = useState('');
  const [srcSheet, setSrcSheet] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [groupBy, setGroupBy] = useState('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [columnMap, setColumnMap] = useState({});
  const [rules, setRules] = useState({ checkRequired: true, checkTypes: true, checkFormats: true, checkEnums: true, checkDuplicates: false });
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleDemoFile = useCallback(async (file) => {
  setDemoFile(file); setAnalysis(null); setResult(null); setShowMapping(false); setColumnMap({});
    try {
      const d = await parseFile(file);
      setDemoParsed(d);
      setDemoSheet(d.sheetNames[0] || '');
    } catch { setError('Failed to parse demo file'); }
  }, []);

  const handleSrcFile = useCallback(async (file) => {
  setSrcFile(file); setResult(null);
    try {
      const d = await parseFile(file);
      setSrcParsed(d);
      setSrcSheet(d.sheetNames[0] || '');
    } catch { setError('Failed to parse source file'); }
  }, []);

  const currentDemoSheet = useMemo(() => {
    if (!demoParsed) return null;
    return demoParsed.sheets.find(s => s.name === demoSheet) || demoParsed.sheets[0] || null;
  }, [demoParsed, demoSheet]);

  const currentSrcSheet = useMemo(() => {
    if (!srcParsed) return null;
    return srcParsed.sheets.find(s => s.name === srcSheet) || srcParsed.sheets[0] || null;
  }, [srcParsed, srcSheet]);

  const runValidation = async () => {
    if (!demoFile || !srcFile) { setError('Upload both demo template and source files'); return; }
    if (!currentDemoSheet || !currentSrcSheet) { setError('Select sheets for both files'); return; }
    setLoading(true); setError(''); setAnalysis(null); setResult(null); setExpandedIssue(null); setActiveTab('overview');
    await new Promise(r => setTimeout(r, 100));
    try {
      const demoAnalysis = analyzeDemo(currentDemoSheet.json, demoSheet);
      if (demoAnalysis.error) { setError('Demo: ' + demoAnalysis.error); setLoading(false); return; }
      const validation = validateSource(currentSrcSheet.json, demoAnalysis, rules, columnMap);
      if (validation.error) { setError('Source: ' + validation.error); setLoading(false); return; }
      setAnalysis({ ...demoAnalysis, demoFileName: demoFile.name });
      setResult({ ...validation, srcFileName: srcFile.name });
    } catch (err) {
      setError('Error: ' + err.message);
    }
    setLoading(false);
  };

  const filteredIssues = useMemo(() => {
    if (!result?.issues) return [];
    let items = result.issues;
    if (filterSeverity !== 'all') items = items.filter(i => i.severity === filterSeverity);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        i.field.toLowerCase().includes(q) || i.message.toLowerCase().includes(q) ||
        i.actual.toLowerCase().includes(q) || i.expected.toLowerCase().includes(q) ||
        String(i.row).includes(q)
      );
    }
    return items;
  }, [result, filterSeverity, searchQuery]);

  const groupedIssues = useMemo(() => {
    if (groupBy === 'none') return { '(all)': filteredIssues };
    const groups = {};
    filteredIssues.forEach(i => {
      const key = groupBy === 'field' ? i.field : groupBy === 'type' ? i.type : i.severity;
      if (!groups[key]) groups[key] = [];
      groups[key].push(i);
    });
    const sorted = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    return Object.fromEntries(sorted);
  }, [filteredIssues, groupBy]);

  const suggestedMapping = useMemo(() => {
    if (!analysis || !result || !srcParsed) return {};
    const srcH = (currentSrcSheet?.json?.[0] || []).map(h => String(h || '').trim()).filter(Boolean);
    const mapping = {};
    analysis.headers.forEach(dh => {
      const match = srcH.find(sh =>
        sh.toLowerCase() === dh.toLowerCase() ||
        sh.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === dh.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      );
      if (match) mapping[dh] = match;
    });
    return mapping;
  }, [analysis, result, srcParsed, currentSrcSheet]);

  const filledExample = useMemo(() => {
    if (!analysis) return null;
    return generateFilledTemplate(analysis.schema);
  }, [analysis]);

  const previewLimit = 20;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📊 Excel Template Validator</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 600 }}>
            Upload a <strong>demo Excel template</strong> and a <strong>source file</strong>. The tool detects schema mismatches, type errors, missing fields, invalid formats, and more.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-sm btn-secondary" onClick={() => setShowPreview(p => !p)}>
            {showPreview ? 'Hide Preview' : '📋 Data Preview'}
          </button>
          <button className="btn-sm btn-secondary" onClick={() => setShowMapping(m => !m)}>
            {showMapping ? 'Hide Mapping' : '🔗 Column Mapping'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'start' }}>
          <div>
            <FileDropzone label="Demo / Template File" icon="📋" file={demoFile}
              onFile={handleDemoFile} onRemove={() => { setDemoFile(null); setDemoParsed(null); setAnalysis(null); setResult(null); }}
              accept=".xlsx,.xls,.csv" />
            {demoParsed && demoParsed.sheetNames.length > 1 && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Sheet:</span>
                <select value={demoSheet} onChange={e => setDemoSheet(e.target.value)}
                  style={{ fontSize: 12, padding: '3px 8px', flex: 1 }}>
                  {demoParsed.sheetNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 32 }}>
            <button className="btn-primary" onClick={runValidation} disabled={loading || !demoFile || !srcFile}
              style={{ height: 44, minWidth: 200, fontSize: 15, fontWeight: 600 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <span className="spinner" /> Validating...
                </span>
              ) : '🔍 Validate Source File'}
            </button>
            {(!demoFile || !srcFile) && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {!demoFile && 'Upload a demo template'} {!demoFile && !srcFile && '&'} {!srcFile && 'Upload a source file'}
              </div>
            )}
          </div>
          <div>
            <FileDropzone label="Source File to Validate" icon="📄" file={srcFile}
              onFile={handleSrcFile} onRemove={() => { setSrcFile(null); setSrcParsed(null); setResult(null); }}
              accept=".xlsx,.xls,.csv" />
            {srcParsed && srcParsed.sheetNames.length > 1 && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Sheet:</span>
                <select value={srcSheet} onChange={e => setSrcSheet(e.target.value)}
                  style={{ fontSize: 12, padding: '3px 8px', flex: 1 }}>
                  {srcParsed.sheetNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {showMapping && analysis && result && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 'var(--radius)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>🔗 Column Mapping</h4>
              <button className="btn-sm btn-secondary" onClick={() => setColumnMap(suggestedMapping)} style={{ fontSize: 11 }}>
                Auto-Map
              </button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Map demo columns to source columns if names differ.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {analysis.headers.map(dh => {
                const srcH = (currentSrcSheet?.json?.[0] || []).map(h => String(h || '').trim()).filter(Boolean);
                return (
                  <div key={dh} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, minWidth: 120, fontSize: 12 }}>{dh}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>→</span>
                    <select value={columnMap[dh] || ''} onChange={e => setColumnMap(m => ({ ...m, [dh]: e.target.value }))}
                      style={{ flex: 1, fontSize: 12, padding: '2px 6px' }}>
                      <option value="">(not mapped)</option>
                      {srcH.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    {suggestedMapping[dh] && !columnMap[dh] && (
                      <span style={{ fontSize: 10, color: 'var(--accent)' }}>suggest: "{suggestedMapping[dh]}"</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showPreview && currentDemoSheet && currentSrcSheet && (
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <div style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                📋 Demo Preview ({demoSheet})
              </div>
              <div style={{ maxHeight: 250, overflow: 'auto', fontSize: 11 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {(currentDemoSheet.json[0] || []).map((h, i) => (
                        <th key={i} style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-secondary)', fontWeight: 600, position: 'sticky', top: 0 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentDemoSheet.json.slice(1, previewLimit + 1).map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding: '3px 8px', borderBottom: '1px solid var(--border-color)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell ?? ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {currentDemoSheet.json.length > previewLimit + 1 && (
                  <div style={{ padding: '4px 8px', fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center' }}>
                    +{currentDemoSheet.json.length - previewLimit - 1} more rows
                  </div>
                )}
              </div>
            </div>
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <div style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                📄 Source Preview ({srcSheet})
              </div>
              <div style={{ maxHeight: 250, overflow: 'auto', fontSize: 11 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {(currentSrcSheet.json[0] || []).map((h, i) => (
                        <th key={i} style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-secondary)', fontWeight: 600, position: 'sticky', top: 0 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentSrcSheet.json.slice(1, previewLimit + 1).map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding: '3px 8px', borderBottom: '1px solid var(--border-color)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell ?? ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {currentSrcSheet.json.length > previewLimit + 1 && (
                  <div style={{ padding: '4px 8px', fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center' }}>
                    +{currentSrcSheet.json.length - previewLimit - 1} more rows
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,71,111,0.1), rgba(239,71,111,0.05))',
          border: '1px solid rgba(239,71,111,0.3)', color: 'var(--danger)',
          padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {analysis && !loading && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
              📋 Template Analysis: {analysis.demoFileName}
              {demoSheet && <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> / {demoSheet}</span>}
            </h3>
            <button className="btn-sm btn-secondary" onClick={() => setShowTemplatePreview(p => !p)} style={{ fontSize: 11 }}>
              {showTemplatePreview ? 'Hide' : 'Show Filled Example'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            {[
              { label: 'Columns', value: analysis.headers.length, color: 'var(--accent)', icon: '📊' },
              { label: 'Data Rows', value: analysis.rowCount, color: 'var(--info)', icon: '📝' },
              { label: 'Required Fields', value: analysis.schema.filter(s => s.required).length, color: 'var(--danger)', icon: '❗' },
              { label: 'Types Detected', value: analysis.schema.filter(s => s.type !== 'any').length, color: 'var(--success)', icon: '🏷️' },
              { label: 'Avg Confidence', value: analysis.schema.length ? (analysis.schema.reduce((s, c) => s + c.confidence, 0) / analysis.schema.length * 100).toFixed(0) + '%' : '—', color: 'var(--warning)', icon: '🎯' },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: '10px 12px', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)', textAlign: 'center',
                borderLeft: `3px solid ${stat.color}`,
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>{stat.icon} {stat.label}</div>
                <div style={{ fontWeight: 700, fontSize: 20, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 0' }}>
              Schema Details ({analysis.schema.length} columns)  <span style={{ fontWeight: 400 }}>— click to expand</span>
            </summary>
            <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', padding: '8px 12px', fontWeight: 600, fontSize: 11, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <span style={{ width: '18%' }}>Column</span>
                <span style={{ width: '14%' }}>Type</span>
                <span style={{ width: '8%' }}>Req.</span>
                <span style={{ width: '14%' }}>Fill Rate</span>
                <span style={{ width: '16%' }}>Uniques</span>
                <span style={{ width: '30%' }}>Examples</span>
              </div>
              {analysis.schema.map((col, i) => (
                <div key={i} style={{
                  display: 'flex', padding: '6px 12px', fontSize: 12, alignItems: 'center',
                  borderBottom: '1px solid var(--border-color)',
                  background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                }}>
                  <span style={{ width: '18%', fontWeight: 600 }}>{col.name}</span>
                  <span style={{ width: '14%' }}>
                    <span style={{
                      display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                      background: col.type === 'any' ? 'var(--bg-secondary)' : col.confidence > 0.8 ? 'rgba(67,181,129,0.15)' : 'rgba(255,209,102,0.15)',
                      color: col.confidence > 0.8 ? 'var(--success)' : 'var(--warning)',
                    }}>
                      {col.type}{col.confidence < 1 && col.type !== 'any' ? ` ${(col.confidence * 100).toFixed(0)}%` : ''}
                    </span>
                  </span>
                  <span style={{ width: '8%' }}>
                    {col.required
                      ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>✓</span>
                      : <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>—</span>}
                  </span>
                  <span style={{ width: '14%' }}>
                    <Bar value={col.filledRows} max={col.totalRows} color={col.filledRows === col.totalRows ? 'var(--success)' : 'var(--warning)'} />
                  </span>
                  <span style={{ width: '16%', fontSize: 11, color: 'var(--text-secondary)' }}>
                    {col.uniqueCount} / {col.totalRows}
                  </span>
                  <span style={{
                    width: '30%', fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {col.examples.join(', ') || '—'}
                  </span>
                </div>
              ))}
            </div>
          </details>

          {showTemplatePreview && filledExample && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 'var(--radius)', background: 'rgba(67,181,129,0.06)', border: '1px solid rgba(67,181,129,0.2)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--success)' }}>
                🎯 Filled Example Row
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                {filledExample.headers.map((h, i) => (
                  <div key={i} style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--bg-secondary)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 2 }}>{h}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{filledExample.data[0][i]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'checkRequired', label: 'Required', desc: 'Check empty required fields' },
            { key: 'checkTypes', label: 'Types', desc: 'Check data type mismatches' },
            { key: 'checkFormats', label: 'Formats', desc: 'Check email, URL, date, phone formats' },
            { key: 'checkEnums', label: 'Enums', desc: 'Check against known values' },
            { key: 'checkDuplicates', label: 'Duplicates', desc: 'Flag duplicate values' },
          ].map(rule => (
            <label key={rule.key} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', cursor: 'pointer',
              borderRadius: 'var(--radius)', fontSize: 12, userSelect: 'none',
              background: rules[rule.key] ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
              border: `1px solid ${rules[rule.key] ? 'var(--accent)' : 'var(--border-color)'}`,
              transition: 'all 0.15s',
            }}>
              <input type="checkbox" checked={rules[rule.key]} style={{ accentColor: 'var(--accent)' }}
                onChange={e => setRules(r => ({ ...r, [rule.key]: e.target.checked }))} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 11 }}>{rule.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{rule.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12, animation: 'pulse 1.5s infinite' }}>📊</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Reading files, analyzing schema, and validating...</div>
          <div style={{ marginTop: 12, width: 200, height: 4, borderRadius: 2, background: 'var(--border-color)', margin: '12px auto 0', overflow: 'hidden' }}>
            <div style={{ width: '40%', height: '100%', background: 'var(--accent)', borderRadius: 2, animation: 'slide 1.2s ease-in-out infinite' }} />
          </div>
          <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } } @keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } } .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {result && !loading && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                  Results for {result.srcFileName}
                  {srcSheet && <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> / {srcSheet}</span>}
                </h3>
                <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                  {result.stats.totalRows} rows · {result.stats.totalChecks.toLocaleString()} cells checked · {result.stats.totalIssues} issues · Pass rate: <strong style={{ color: result.stats.passRate >= 95 ? 'var(--success)' : result.stats.passRate >= 80 ? 'var(--warning)' : 'var(--danger)' }}>{result.stats.passRate}%</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <div className="btn-group" style={{ display: 'flex', gap: 2 }}>
                  {[
                    { format: 'xlsx', label: 'Excel' },
                    { format: 'csv', label: 'CSV' },
                    { format: 'json', label: 'JSON' },
                    { format: 'html', label: 'HTML' },
                  ].map(({ format, label }) => (
                    <button key={format} className="btn-sm btn-secondary"
                      onClick={() => exportReport(result.issues, result.stats, analysis.demoFileName, result.srcFileName, format)}
                      style={{ fontSize: 11, padding: '3px 10px' }}>
                      📥 {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10, marginTop: 14 }}>
              {[
                { label: 'Errors', value: result.stats.errors, color: 'var(--danger)', bg: 'rgba(239,71,111,0.08)' },
                { label: 'Warnings', value: result.stats.warnings, color: 'var(--warning)', bg: 'rgba(255,209,102,0.08)' },
                { label: 'Info', value: result.stats.infos, color: 'var(--info)', bg: 'rgba(67,181,129,0.08)' },
                { label: 'Rows w/ Issues', value: result.stats.rowsWithIssues, color: 'var(--accent)', bg: 'rgba(99,102,241,0.08)' },
                { label: 'Clean Rows', value: result.stats.totalRows - result.stats.rowsWithIssues, color: 'var(--success)', bg: 'rgba(67,181,129,0.08)' },
              ].map((stat, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 'var(--radius)', background: stat.bg, textAlign: 'center', borderTop: `2px solid ${stat.color}` }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {result.stats.totalIssues > 0 && analysis && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Issue Distribution by Type</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {Object.entries(result.stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                    <Bar key={type} label={type.replace(/_/g, ' ')} value={count} max={result.stats.totalIssues} color={type.includes('missing') || type.includes('required') || type.includes('type') ? 'var(--danger)' : 'var(--warning)'} height={8} />
                  ))}
                </div>
              </div>
            )}

            {result.stats.totalIssues === 0 && (
              <div style={{ marginTop: 16, padding: 24, borderRadius: 'var(--radius)', background: 'rgba(67,181,129,0.06)', border: '1px solid rgba(67,181,129,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--success)' }}>Perfect Match — No Issues Found!</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  The source file matches the demo template with {result.stats.passRate}% pass rate across {result.stats.totalChecks.toLocaleString()} cell checks.
                </div>
              </div>
            )}
          </div>

          {result.issues.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>🔍 Issues ({filteredIssues.length})</h4>
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search issues..." style={{ width: 180, fontSize: 12, padding: '5px 10px' }} />
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
                    style={{ fontSize: 11, padding: '3px 8px' }}>
                    {GROUP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'error', label: 'Errors' },
                      { key: 'warning', label: 'Warnings' },
                      { key: 'info', label: 'Info' },
                    ].map(s => (
                      <button key={s.key}
                        className={`btn-${filterSeverity === s.key ? 'primary' : 'secondary'} btn-sm`}
                        onClick={() => setFilterSeverity(s.key)}
                        style={{ fontSize: 11, padding: '3px 10px', textTransform: 'capitalize' }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {Object.entries(groupedIssues).map(([group, issues]) => (
                <div key={group}>
                  {groupBy !== 'none' && (
                    <div style={{
                      padding: '6px 12px', fontSize: 12, fontWeight: 600, marginTop: 8, marginBottom: 4,
                      borderRadius: 'var(--radius)', background: 'var(--bg-secondary)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span>
                        {groupBy === 'field' && <span style={{ color: 'var(--accent)' }}>📋 </span>}
                        {groupBy === 'severity' && <span>{group === 'error' ? '❌' : group === 'warning' ? '⚠️' : 'ℹ️'} </span>}
                        {groupBy === 'type' && <span>📌 </span>}
                        {group} ({issues.length} issue{issues.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
                  <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', padding: '8px 14px', fontWeight: 600, fontSize: 11, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <span style={{ width: 40 }}>Row</span>
                      <span style={{ width: '14%' }}>Field</span>
                      <span style={{ width: 70 }}>Severity</span>
                      <span style={{ flex: 1 }}>Issue</span>
                    </div>
                    <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                      {issues.map((issue, idx) => (
                        <div key={idx}>
                          <div
                            onClick={() => setExpandedIssue(expandedIssue === `${group}-${idx}` ? null : `${group}-${idx}`)}
                            style={{
                              display: 'flex', padding: '7px 14px', fontSize: 12, alignItems: 'center', cursor: 'pointer',
                              borderBottom: '1px solid var(--border-color)',
                              background: issue.severity === 'error' ? 'rgba(239,71,111,0.04)' : issue.severity === 'warning' ? 'rgba(255,209,102,0.04)' : 'transparent',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = issue.severity === 'error' ? 'rgba(239,71,111,0.08)' : issue.severity === 'warning' ? 'rgba(255,209,102,0.08)' : 'rgba(99,102,241,0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = issue.severity === 'error' ? 'rgba(239,71,111,0.04)' : issue.severity === 'warning' ? 'rgba(255,209,102,0.04)' : 'transparent'}
                          >
                            <span style={{ width: 40, fontWeight: 600, color: 'var(--text-secondary)' }}>{issue.row}</span>
                            <span style={{ width: '14%', fontWeight: 600, color: 'var(--accent)' }}>{issue.field}</span>
                            <span style={{ width: 70 }}><SeverityBadge severity={issue.severity} /></span>
                            <span style={{ flex: 1, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.message}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 10, marginLeft: 8 }}>
                              {expandedIssue === `${group}-${idx}` ? '▲' : '▼'}
                            </span>
                          </div>
                          {expandedIssue === `${group}-${idx}` && (
                            <div style={{
                              padding: '10px 14px 12px 54px', fontSize: 12,
                              background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
                              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px',
                            }}>
                              <div><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Expected:</span> <span style={{ color: 'var(--success)' }}>{issue.expected}</span></div>
                              <div><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Actual:</span> <span style={{ color: 'var(--danger)' }}>{issue.actual}</span></div>
                              {issue.resolution && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>💡 Suggestion:</span>
                                  <span style={{ color: 'var(--accent)', marginLeft: 4 }}>{issue.resolution}</span>
                                </div>
                              )}
                              {issue.suggestions?.length > 0 && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>🔗 Similar columns in source:</span>
                                  <span style={{ color: 'var(--warning)', marginLeft: 4 }}>{issue.suggestions.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <CopyButton text={JSON.stringify(filteredIssues, null, 2)} label="📋 Copy Issues" />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', alignSelf: 'center' }}>
                  Showing {filteredIssues.length} of {result.issues.length} total issues
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
