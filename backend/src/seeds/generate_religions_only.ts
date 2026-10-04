import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';

export const generateReligionsOnlyXlsx = async (): Promise<string[]> => {
  const religions = [
    { name: 'Hinduism' },
    { name: 'Islam' },
    { name: 'Christianity' },
    { name: 'Sikhism' },
    { name: 'Buddhism' },
    { name: 'Jainism' },
    { name: 'Zoroastrianism (Parsi)' },
    { name: 'Sarna / Tribal Beliefs' },
    { name: 'Other' },
  ];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ranniti System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Religions Master');

  worksheet.columns = [
    { header: 'name', key: 'name', width: 30 },
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

  religions.forEach((r, idx) => {
    const row = worksheet.addRow(r);
    row.height = 20;

    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F8FAFC' },
      };
    }

    row.getCell('name').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('name').border = {
      top: { style: 'thin', color: { argb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
      left: { style: 'thin', color: { argb: 'E2E8F0' } },
      right: { style: 'thin', color: { argb: 'E2E8F0' } },
    };
  });

  const rootXlsxDir = path.join(__dirname, '../../../xlsx');
  const targetPaths = [
    path.join(rootXlsxDir, 'religions_only.xlsx'),
    path.join(__dirname, 'data/religions_only.xlsx'),
  ];

  for (const p of targetPaths) {
    if (!fs.existsSync(path.dirname(p))) {
      fs.mkdirSync(path.dirname(p), { recursive: true });
    }
    await workbook.xlsx.writeFile(p);
  }

  return targetPaths;
};

if (require.main === module || (process.argv[1] && process.argv[1].endsWith('generate_religions_only.ts'))) {
  generateReligionsOnlyXlsx()
    .then((paths) => {
      console.log('Successfully generated Religions Only XLSX at:', paths);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to generate file:', err);
      process.exit(1);
    });
}
