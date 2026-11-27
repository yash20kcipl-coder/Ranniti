import ExcelJS from 'exceljs';
import { logger } from './logger';

export interface ExcelParseOptions {
  /**
   * 1-based index of worksheet to read (default: 1)
   */
  sheetIndex?: number;
  /**
   * Name of worksheet to read if specified
   */
  sheetName?: string;
}

/**
 * Safely and recursively extracts plain text or scalar values from any ExcelJS cell representation,
 * handling hyperlinks, nested rich text arrays, formula results, dates, and primitive types.
 */
export function extractCellValue(val: any): any {
  if (val == null) return '';
  if (typeof val !== 'object') return val;

  // Hyperlink cell: { text: string | { richText: [...] }, hyperlink: '...' }
  if ('text' in val && val.text != null) {
    return extractCellValue(val.text);
  }

  // Rich text array: { richText: [{ text: '...' }] }
  if (Array.isArray(val.richText)) {
    return val.richText.map((rt: any) => (rt && rt.text != null ? String(rt.text) : '')).join('');
  }

  // Formula evaluated result: { formula: '...', result: '...' }
  if ('result' in val && val.result != null) {
    return extractCellValue(val.result);
  }

  // Date object
  if (val instanceof Date) {
    return val.toISOString();
  }

  // If object has a custom toString representation
  if (typeof val.toString === 'function' && val.toString !== Object.prototype.toString) {
    return val.toString();
  }

  return '';
}

/**
 * Robustly reads an Excel (.xlsx) file into an array of row objects.
 * Uses standard ExcelJS.Workbook.readFile to avoid known streaming WorkbookReader bugs
 * (e.g. "Cannot read properties of undefined (reading 'sheets')"), with streaming fallback.
 */
export async function readRecordsFromExcel(
  filePath: string,
  options: ExcelParseOptions = {}
): Promise<Record<string, any>[]> {
  const records: Record<string, any>[] = [];

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    let worksheet: ExcelJS.Worksheet | undefined;
    if (options.sheetName) {
      worksheet = workbook.getWorksheet(options.sheetName);
    }
    if (!worksheet) {
      worksheet = workbook.worksheets[0];
    }
    if (!worksheet) {
      return records;
    }

    let headers: string[] = [];
    let firstRow = true;

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const values = row.values as any[];
      const cells = Array.isArray(values) ? values.slice(1) : [];

      if (firstRow) {
        headers = cells.map((v) => (v != null ? String(v).trim() : ''));
        firstRow = false;
        return;
      }

      const rowObj: Record<string, any> = { __rowIndex: rowNumber };
      for (let i = 0; i < headers.length; i++) {
        const key = headers[i];
        if (!key) continue;
        rowObj[key] = extractCellValue(cells[i]);
      }

      const hasData = Object.entries(rowObj).some(
        ([k, v]) => k !== '__rowIndex' && v !== '' && v != null
      );
      if (hasData) {
        records.push(rowObj);
      }
    });

    return records;
  } catch (readErr) {
    logger.warn(`[ExcelReader] Standard workbook read failed for ${filePath}, attempting stream fallback:`, readErr);

    // Fallback to streaming reader if standard fails (e.g. huge files)
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
      sharedStrings: 'cache',
      hyperlinks: 'ignore',
      styles: 'ignore',
      worksheets: 'emit',
    });

    let headers: string[] = [];
    let firstRow = true;
    let sheetFound = false;
    let currentRowNumber = 1;

    for await (const worksheetReader of workbookReader) {
      if (sheetFound) break;
      sheetFound = true;

      for await (const row of worksheetReader) {
        currentRowNumber++;
        const values = (row as ExcelJS.Row).values as any[];
        const cells = Array.isArray(values) ? values.slice(1) : [];

        if (firstRow) {
          headers = cells.map((v) => (v != null ? String(v).trim() : ''));
          firstRow = false;
          continue;
        }

        const rowObj: Record<string, any> = { __rowIndex: currentRowNumber };
        for (let i = 0; i < headers.length; i++) {
          const key = headers[i];
          if (!key) continue;
          rowObj[key] = extractCellValue(cells[i]);
        }

        const hasData = Object.entries(rowObj).some(
          ([k, v]) => k !== '__rowIndex' && v !== '' && v != null
        );
        if (hasData) {
          records.push(rowObj);
        }
      }
    }

    return records;
  }
}
