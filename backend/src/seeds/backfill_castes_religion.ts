/**
 * One-time backfill: reads castes_subcastes.xlsx and updates
 * religion_id + parent_caste_id for all existing castes.
 *
 * Run: npx ts-node src/seeds/backfill_castes_religion.ts
 */
import path from 'path';
import ExcelJS from 'exceljs';
import { logger } from '../utils/logger';
import { query, closeDbPool } from '../queries/dbPool';

async function main() {
  const xlsxPath = path.resolve(process.cwd(), '../xlsx/castes_subcastes.xlsx');

  // 1. Load religions name→id map from DB
  const relRes = await query('SELECT id, name FROM religions');
  const religionMap = new Map<string, string>();
  for (const r of relRes.rows) {
    religionMap.set(r.name.toLowerCase().trim(), r.id);
  }
  logger.info(`Loaded ${religionMap.size} religions`);

  // 2. Load all castes name→id map from DB
  const casteRes = await query('SELECT id, name FROM castes');
  const casteMap = new Map<string, string>();
  for (const c of casteRes.rows) {
    casteMap.set(c.name.toLowerCase().trim(), c.id);
  }
  logger.info(`Loaded ${casteMap.size} castes`);

  // 3. Parse xlsx
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const sheet = wb.getWorksheet(1)!;

  const rows: { name: string; religionName: string; parentCasteName: string }[] = [];
  sheet.eachRow((row, i) => {
    if (i === 1) return; // skip header
    const name = (row.getCell(1).value || '').toString().trim();
    const religionName = (row.getCell(3).value || '').toString().trim();
    const parentCasteName = (row.getCell(4).value || '').toString().trim();
    if (name) rows.push({ name, religionName, parentCasteName });
  });
  logger.info(`Parsed ${rows.length} rows from xlsx`);

  // 4. Update each caste
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const casteName = row.name.toLowerCase().trim();
    const casteId = casteMap.get(casteName);
    if (!casteId) { skipped++; continue; }

    const religionId = religionMap.get(row.religionName.toLowerCase().trim()) || null;
    const parentCasteId = row.parentCasteName
      ? casteMap.get(row.parentCasteName.toLowerCase().trim()) || null
      : null;

    await query(
      `UPDATE castes
          SET religion_id     = COALESCE($1, religion_id),
              parent_caste_id = COALESCE($2, parent_caste_id),
              updated_at      = NOW()
        WHERE id = $3`,
      [religionId, parentCasteId, casteId]
    );
    updated++;
  }

  logger.info(`Backfill complete: updated=${updated}, skipped=${skipped}`);

  // 5. Report remaining nulls
  const nullCheck = await query('SELECT COUNT(*) FROM castes WHERE religion_id IS NULL');
  logger.info(`Castes still with null religion_id: ${nullCheck.rows[0].count}`);

  await closeDbPool();
}

main().catch((e) => {
  logger.error('Backfill failed:', e.message);
  process.exit(1);
});
