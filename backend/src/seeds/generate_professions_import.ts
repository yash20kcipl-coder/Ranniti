import path from 'path';
import ExcelJS from 'exceljs';
import { initialProfessionCategories } from './data/professions.seed';
import { logger } from '../utils/logger';

export async function generateProfessionsXlsx(): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ranniti Platform';
  workbook.lastModifiedBy = 'Ranniti Platform';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Professions Master', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  worksheet.columns = [
    { header: 'Profession Category', key: 'category', width: 35 },
    { header: 'Specific Profession', key: 'profession', width: 45 },
  ];

  // Header style
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Slate-800
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  headerRow.height = 24;

  for (const cat of initialProfessionCategories) {
    for (const prof of cat.professions) {
      worksheet.addRow({
        category: cat.name,
        profession: prof,
      });
    }
  }

  const outputPath = path.resolve(__dirname, '../../../xlsx/professions.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  logger.info(`✅ Generated standard professions spreadsheet at: ${outputPath}`);
  return outputPath;
}

if (require.main === module) {
  generateProfessionsXlsx()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Failed to generate professions excel:', err);
      process.exit(1);
    });
}
