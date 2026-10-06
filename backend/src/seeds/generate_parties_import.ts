import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import partiesData from './data/parties.json';

export const generatePartiesImportXlsx = async (): Promise<string[]> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ranniti System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Political Parties');

  worksheet.columns = [
    { header: 'name', key: 'name', width: 45 },
    { header: 'abbreviation', key: 'abbreviation', width: 18 },
    { header: 'symbolLogo', key: 'symbolLogo', width: 35 },
    { header: 'alliance', key: 'alliance', width: 40 },
  ];

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E3A8A' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 26;

  partiesData.forEach((party, idx) => {
    const row = worksheet.addRow({
      name: party.name,
      abbreviation: party.abbreviation,
      symbolLogo: party.symbolLogo || '',
      alliance: party.alliance || '',
    });
    row.height = 20;

    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F8FAFC' },
      };
    }

    ['name', 'abbreviation', 'symbolLogo', 'alliance'].forEach((colKey) => {
      const cell = row.getCell(colKey);
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } },
      };
    });
  });

  const rootXlsxDir = path.join(__dirname, '../../../xlsx');
  const targetPaths = [
    path.join(rootXlsxDir, 'political_parties.xlsx'),
    path.join(__dirname, 'data/political_parties.xlsx'),
  ];

  for (const p of targetPaths) {
    if (!fs.existsSync(path.dirname(p))) {
      fs.mkdirSync(path.dirname(p), { recursive: true });
    }
    await workbook.xlsx.writeFile(p);
  }

  return targetPaths;
};

if (require.main === module || (process.argv[1] && process.argv[1].endsWith('generate_parties_import.ts'))) {
  generatePartiesImportXlsx()
    .then((paths) => {
      console.log('Successfully generated Political Parties XLSX at:', paths);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to generate Political Parties XLSX file:', err);
      process.exit(1);
    });
}
