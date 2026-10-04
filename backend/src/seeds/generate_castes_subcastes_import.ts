import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import religionsCastes from './data/religions_castes.json';

export interface CasteSubcasteRecord {
  name: string;           // caste or subcaste name
  category: string;
  religionName: string;
  parentCasteName: string; // empty for top-level castes, parent caste name for subcastes
}

export const generateCastesSubcastesXlsx = async (): Promise<string[]> => {
  const records: CasteSubcasteRecord[] = [];

  for (const caste of religionsCastes.castes) {
    const religionName = caste.religionName || 'Hinduism';
    const category = caste.category || 'General';
    const casteName = caste.name;

    // Top-level caste row
    records.push({
      name: casteName,
      category,
      religionName,
      parentCasteName: '',
    });

    // Subcaste rows — parentCasteName links them to their parent
    if (Array.isArray(caste.subcastes)) {
      for (const subcaste of caste.subcastes) {
        records.push({
          name: subcaste,
          category,
          religionName,
          parentCasteName: casteName,
        });
      }
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ranniti System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Castes & Subcastes Master');

  worksheet.columns = [
    { header: 'name', key: 'name', width: 35 },
    { header: 'category', key: 'category', width: 18 },
    { header: 'religionName', key: 'religionName', width: 25 },
    { header: 'parentCasteName', key: 'parentCasteName', width: 35 },
  ];

  // Header row styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4338CA' }, // Indigo Header
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 26;

  // Add rows
  records.forEach((rec, idx) => {
    const row = worksheet.addRow({
      name: rec.name,
      category: rec.category,
      religionName: rec.religionName,
      parentCasteName: rec.parentCasteName,
    });

    row.height = 20;

    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'EEF2FF' },
      };
    }

    row.getCell('name').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('category').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('religionName').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('parentCasteName').alignment = { vertical: 'middle', horizontal: 'left' };

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'E0E7FF' } },
        bottom: { style: 'thin', color: { argb: 'E0E7FF' } },
        left: { style: 'thin', color: { argb: 'E0E7FF' } },
        right: { style: 'thin', color: { argb: 'E0E7FF' } },
      };
    });
  });

  const rootXlsxDir = path.join(__dirname, '../../../xlsx');
  const targetPaths = [
    path.join(rootXlsxDir, 'castes_subcastes.xlsx'),
    path.join(__dirname, 'data/castes_subcastes.xlsx'),
  ];

  for (const p of targetPaths) {
    if (!fs.existsSync(path.dirname(p))) {
      fs.mkdirSync(path.dirname(p), { recursive: true });
    }
    await workbook.xlsx.writeFile(p);
  }

  return targetPaths;
};

if (require.main === module || (process.argv[1] && process.argv[1].endsWith('generate_castes_subcastes_import.ts'))) {
  generateCastesSubcastesXlsx()
    .then((paths) => {
      console.log('Successfully generated Castes & Subcastes XLSX at:', paths);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to generate Castes & Subcastes XLSX:', err);
      process.exit(1);
    });
}
