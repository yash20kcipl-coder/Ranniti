import * as XLSX from 'xlsx';
import type { MasterField } from '@/config/masterConfig';

/**
 * Exports data directly to an Excel (.XLSX) file and triggers browser download.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const exportToExcel = (
  data: Record<string, any>[],
  filename: string,
  preferredKeys?: string[]
): void => {
  if (!data || data.length === 0) {
    throw new Error('No data available to export.');
  }

  const keys = preferredKeys && preferredKeys.length > 0
    ? preferredKeys
    : Array.from(new Set(data.flatMap((obj) => Object.keys(obj))));

  const filteredKeys = keys.filter((k) => k !== 'createdAt' && k !== 'updatedAt' && k !== 'id');

  const formattedData = data.map((row) => {
    const cleanRow: Record<string, any> = {};
    filteredKeys.forEach((key) => {
      let val = row[key];
      // If key or value is an ID reference, automatically resolve to readable name if available
      if (typeof val === 'string' && (UUID_REGEX.test(val) || key.endsWith('Id'))) {
        const nameKey = key.endsWith('Id') ? key.replace(/Id$/, 'Name') : null;
        if (nameKey && row[nameKey]) {
          val = row[nameKey];
        }
      }
      cleanRow[key] = val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val) : val;
    });
    return cleanRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Data');

  XLSX.writeFile(workbook, `${filename.replace(/\.xlsx$/i, '')}.xlsx`);
};

/** Maximum file size the browser can parse in-memory (~20 MB). Larger files must be uploaded to backend. */
const MAX_BROWSER_PARSE_BYTES = 20 * 1024 * 1024;

/**
 * Parses an Excel (.xlsx / .xls) file into an array of key-value objects.
 * - Rejects files over 20 MB (browser OOM risk).
 * - Scans all sheets and picks the first one with actual data rows.
 */
export const parseExcelFile = async (file: File): Promise<Record<string, any>[]> => {
  if (file.size > MAX_BROWSER_PARSE_BYTES) {
    return Promise.reject(
      new Error(
        `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB — too large for in-browser parsing. ` +
        `It will be uploaded directly to the server for streaming import.`
      )
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          resolve([]);
          return;
        }

        // Scan all sheets and pick the first one that has data rows
        let jsonRecords: Record<string, any>[] = [];
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
          if (rows.length > 0) {
            jsonRecords = rows;
            break;
          }
        }

        resolve(jsonRecords);
      } catch (err) {
        reject(new Error('Failed to parse Excel file format. Please upload a valid .xlsx file.'));
      }
    };
    reader.onerror = () => reject(new Error('File reading error.'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Dynamically generates and downloads a sample Excel (.xlsx) template based on field specifications.
 */
export const downloadSampleExcelTemplate = (fields: MasterField[], filename: string): void => {
  const headers = fields.map((f) => f.name);
  const sampleRow: Record<string, any> = {};

  fields.forEach((f) => {
    if (f.placeholder) {
      sampleRow[f.name] = f.placeholder.replace(/^e\.g\.\s*/i, '');
    } else if (f.type === 'number') {
      sampleRow[f.name] = 1;
    } else {
      sampleRow[f.name] = `Sample ${f.label}`;
    }
  });

  const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Data');

  XLSX.writeFile(workbook, `sample_${filename.replace(/\.xlsx$/i, '')}.xlsx`);
};
