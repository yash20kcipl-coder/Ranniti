import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { getSystemAllACs } from './generate_all_4123_acs';

export interface WardImportRecord {
  stateName: string;
  pcName: string;
  acNumber: number;
  acName: string;
  wardNumber: number;
  wardName: string;
}

export async function generateWardsImportFiles() {
  const acList = getSystemAllACs();
  const wardRecords: WardImportRecord[] = [];

  // Generate 2 Wards for every Assembly Constituency across India
  for (const ac of acList) {
    wardRecords.push({
      stateName: ac.stateName,
      pcName: ac.pcName,
      acNumber: ac.acNumber,
      acName: ac.acName,
      wardNumber: 1,
      wardName: `Ward No. 1 (${ac.acName})`,
    });
    wardRecords.push({
      stateName: ac.stateName,
      pcName: ac.pcName,
      acNumber: ac.acNumber,
      acName: ac.acName,
      wardNumber: 2,
      wardName: `Ward No. 2 (${ac.acName})`,
    });
  }

  console.log('=========================================');
  console.log(`Generated total Ward records count: ${wardRecords.length}`);
  console.log('=========================================');

  // 1. Write Excel (.xlsx) file
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ranniti';
  const worksheet = workbook.addWorksheet('Wards');

  worksheet.columns = [
    { header: 'State Name', key: 'stateName', width: 22 },
    { header: 'PC Name', key: 'pcName', width: 25 },
    { header: 'AC Number', key: 'acNumber', width: 12 },
    { header: 'AC Name', key: 'acName', width: 25 },
    { header: 'Ward Number', key: 'wardNumber', width: 14 },
    { header: 'Ward Name', key: 'wardName', width: 35 },
  ];

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  for (const rec of wardRecords) {
    worksheet.addRow(rec);
  }

  const excelPath = path.join(__dirname, '../../../../xlsx/all_wards_import.xlsx');
  await workbook.xlsx.writeFile(excelPath);
  console.log(`✅ Excel file written successfully to: ${excelPath}`);

  // 2. Write CSV (.csv) file
  const csvHeaders = ['State Name', 'PC Name', 'AC Number', 'AC Name', 'Ward Number', 'Ward Name'];
  const csvRows = wardRecords.map((r) =>
    [
      `"${r.stateName}"`,
      `"${r.pcName}"`,
      r.acNumber,
      `"${r.acName}"`,
      r.wardNumber,
      `"${r.wardName}"`,
    ].join(',')
  );

  const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
  const csvPath = path.join(__dirname, '../../../../all_wards_import.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`✅ CSV file written successfully to: ${csvPath}`);
}

if (require.main === module) {
  generateWardsImportFiles().catch(console.error);
}
