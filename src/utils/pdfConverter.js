import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createWorker } from 'tesseract.js';
import { utils, write } from 'xlsx-js-style';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function extractLinesFromPage(textContent) {
  const lines = [];
  let currentLine = [];
  let lastY = null;
  for (const item of textContent.items) {
    const y = Math.round(item.transform[5]);
    if (lastY !== null && Math.abs(y - lastY) > 3) {
      lines.push(currentLine.join(' ').trim());
      currentLine = [];
    }
    currentLine.push(item.str);
    lastY = y;
  }
  if (currentLine.length > 0) lines.push(currentLine.join(' ').trim());
  return lines.filter(l => l.length > 0);
}

function linesToRows(lines) {
  return lines.map(l => l.split(/\s{2,}/));
}

function buildExcel(rows, headers) {
  const maxCols = rows.reduce((max, r) => Math.max(max, r.length), 0);
  const finalHeaders = headers || Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
  const paddedRows = rows.map(r => {
    const row = {};
    finalHeaders.forEach((h, i) => { row[h] = r[i] || ''; });
    return row;
  });
  const ws = utils.json_to_sheet(paddedRows);
  ws['!cols'] = finalHeaders.map(h => ({
    wch: Math.max(h.length, ...paddedRows.map(r => String(r[h] || '').length)) + 2,
  }));
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Extracted Data');
  const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return { blobUrl: URL.createObjectURL(blob), paddedRows, finalHeaders };
}

async function ocrPage(page, lang) {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const worker = await createWorker(lang);
  const { data } = await worker.recognize(blob);
  await worker.terminate();
  return data.text;
}

export async function convertPDFToExcel(file, onProgress, language = 'eng') {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allRows = [];
  let headers = null;
  let usedOcr = false;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const totalChars = textContent.items.reduce((s, item) => s + item.str.length, 0);
    const hasText = totalChars > 20;

    if (hasText) {
      if (onProgress) onProgress(i, pdf.numPages, 'text');
      const lines = extractLinesFromPage(textContent);
      const tableData = linesToRows(lines);

      if (tableData.length > 0) {
        if (!headers && tableData[0].length > 1) {
          headers = tableData[0].map(h => h.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || `Column ${allRows.length + 1}`);
          tableData.shift();
        }
        tableData.forEach(row => {
          if (row.length > 0 && row.some(c => c.length > 0)) {
            allRows.push(row);
          }
        });
      }
    } else {
      usedOcr = true;
      if (onProgress) onProgress(i, pdf.numPages, 'ocr');
      const text = await ocrPage(page, language);
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const tableData = linesToRows(lines);

      if (tableData.length > 0) {
        if (!headers && tableData[0].length > 1) {
          headers = tableData[0].map(h => h.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || `Column ${allRows.length + 1}`);
          tableData.shift();
        }
        tableData.forEach(row => {
          if (row.length > 0 && row.some(c => c.length > 0)) {
            allRows.push(row);
          }
        });
      }
    }
  }

  const { blobUrl, paddedRows, finalHeaders } = buildExcel(allRows, headers);
  return {
    rows: paddedRows,
    headers: finalHeaders,
    blobUrl,
    pageCount: pdf.numPages,
    usedOcr,
  };
}
