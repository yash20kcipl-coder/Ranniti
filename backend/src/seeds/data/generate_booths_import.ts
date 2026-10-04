import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { getSystemAllACs } from './generate_all_4123_acs';

export interface BoothImportRecord {
  stateName: string;
  pcName: string;
  acNumber: number;
  acName: string;
  wardNumber: number;
  wardName: string;
  boothNumber: number;
  boothName: string;
  locationBuilding: string;
  totalVoters: number;
}

export async function generateBoothsImportFiles() {
  const acList = getSystemAllACs();
  const boothRecords: BoothImportRecord[] = [];

  // Generate 2 Polling Booths for every Assembly Constituency across India (8,246 Booths total)
  for (const ac of acList) {
    boothRecords.push({
      stateName: ac.stateName,
      pcName: ac.pcName,
      acNumber: ac.acNumber,
      acName: ac.acName,
      wardNumber: 1,
      wardName: `Ward No. 1 (${ac.acName})`,
      boothNumber: 1,
      boothName: `Polling Station No. 1 (${ac.acName})`,
      locationBuilding: `Government High School, ${ac.acName}`,
      totalVoters: 1250,
    });
    boothRecords.push({
      stateName: ac.stateName,
      pcName: ac.pcName,
      acNumber: ac.acNumber,
      acName: ac.acName,
      wardNumber: 2,
      wardName: `Ward No. 2 (${ac.acName})`,
      boothNumber: 2,
      boothName: `Polling Station No. 2 (${ac.acName})`,
      locationBuilding: `Community Hall & ZP Primary School, ${ac.acName}`,
      totalVoters: 1180,
    });
  }

  console.log('=========================================');
  console.log(`Generated total Polling Booth records count: ${boothRecords.length}`);
  console.log('=========================================');

  // Write Excel (.xlsx) file
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ranniti';
  const worksheet = workbook.addWorksheet('Polling Booths');

  worksheet.columns = [
    { header: 'State Name', key: 'stateName', width: 22 },
    { header: 'PC Name', key: 'pcName', width: 25 },
    { header: 'AC Number', key: 'acNumber', width: 12 },
    { header: 'AC Name', key: 'acName', width: 25 },
    { header: 'Ward Number', key: 'wardNumber', width: 14 },
    { header: 'Ward Name', key: 'wardName', width: 35 },
    { header: 'Booth Number', key: 'boothNumber', width: 14 },
    { header: 'Booth Name', key: 'boothName', width: 40 },
    { header: 'Location Building', key: 'locationBuilding', width: 45 },
    { header: 'Total Voters', key: 'totalVoters', width: 14 },
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

  for (const rec of boothRecords) {
    worksheet.addRow(rec);
  }

  const excelPath = path.join(__dirname, '../../../../xlsx/all_booths_import.xlsx');
  await workbook.xlsx.writeFile(excelPath);
  console.log(`✅ Excel file written successfully to: ${excelPath}`);
}

if (require.main === module) {
  generateBoothsImportFiles().catch(console.error);
}
