import path from 'path';
import ExcelJS from 'exceljs';
import religionsCastes from './data/religions_castes.json';

export interface ReligionCasteImportRecord {
  religionName: string;
  category: string;
  casteName: string;
  subcasteName: string;
}

export const generateReligionsCastesXlsx = async (outputPath?: string): Promise<string> => {
  const records: ReligionCasteImportRecord[] = [];

  for (const caste of religionsCastes.castes) {
    const religionName = caste.religionName || 'Hinduism';
    const category = caste.category || 'General';
    const casteName = caste.name;

    if (Array.isArray(caste.subcastes) && caste.subcastes.length > 0) {
      for (const subcaste of caste.subcastes) {
        records.push({
          religionName,
          category,
          casteName,
          subcasteName: subcaste,
        });
      }
    } else {
      records.push({
        religionName,
        category,
        casteName,
        subcasteName: '',
      });
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ranniti System';
  workbook.lastModifiedBy = 'Ranniti System';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Religions & Castes');

  worksheet.columns = [
    { header: 'Religion Name', key: 'religionName', width: 25 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Caste Name', key: 'casteName', width: 35 },
    { header: 'Subcaste Name', key: 'subcasteName', width: 35 },
  ];

  // Apply styling to Header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E3A8A' }, // Primary Navy Blue
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 26;

  // Add Data Rows
  records.forEach((rec, idx) => {
    const row = worksheet.addRow({
      religionName: rec.religionName,
      category: rec.category,
      casteName: rec.casteName,
      subcasteName: rec.subcasteName,
    });

    row.height = 20;

    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F8FAFC' },
      };
    }

    row.getCell('religionName').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('category').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('casteName').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('subcasteName').alignment = { vertical: 'middle', horizontal: 'left' };

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } },
      };
    });
  });

  const fs = await import('fs');
  const rootXlsxDir = path.join(__dirname, '../../../xlsx');
  const targetPaths = [
    path.join(rootXlsxDir, 'religions_castes.xlsx'),
    path.join(__dirname, 'data/religions_castes.xlsx'),
  ];

  if (outputPath) {
    targetPaths.push(outputPath);
  }

  for (const p of targetPaths) {
    if (!fs.existsSync(path.dirname(p))) {
      fs.mkdirSync(path.dirname(p), { recursive: true });
    }
    await workbook.xlsx.writeFile(p);
  }

  return targetPaths[0];
};

if (require.main === module || (process.argv[1] && process.argv[1].endsWith('generate_religions_castes_import.ts'))) {
  generateReligionsCastesXlsx()
    .then((filePath) => {
      console.log(`Successfully generated XLSX file at: ${filePath}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to generate XLSX file:', err);
      process.exit(1);
    });
}
