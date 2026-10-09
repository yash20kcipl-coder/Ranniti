import path from 'path';
import ExcelJS from 'exceljs';
import { query, closeDbPool } from '../queries/dbPool';
import { logger } from '../utils/logger';
import { BulkImporter } from '../utils/bulkImporter';
import { BatchInsertQuery } from '../queries/batchInsert.query';
import { CacheService } from '../services/cache.service';

const sourceFile = path.resolve(__dirname, '../../../xlsx/voters_ac_101_formatted.xlsx');

/**
 * Streams a large .xlsx file row-by-row using ExcelJS, avoiding full in-memory load.
 * Returns an async iterable of plain row objects keyed by header column names.
 */
async function* streamExcelRows(filePath: string): AsyncGenerator<Record<string, any>> {
  const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    sharedStrings: 'cache',
    hyperlinks: 'ignore',
    styles: 'ignore',
    worksheets: 'emit',
  });

  let headers: string[] = [];
  let firstRow = true;

  for await (const worksheetReader of workbookReader) {
    if ((worksheetReader as any).name !== 'Voters') continue;

    for await (const row of worksheetReader) {
      const values = (row as ExcelJS.Row).values as any[];
      // ExcelJS row.values is 1-indexed (index 0 is null)
      const cells = Array.isArray(values) ? values.slice(1) : [];

      if (firstRow) {
        headers = cells.map((v) => (v != null ? String(v).trim() : ''));
        firstRow = false;
        continue;
      }

      // Build a plain object from headers + cell values
      const rowObj: Record<string, any> = {};
      for (let i = 0; i < headers.length; i++) {
        const key = headers[i];
        if (key) {
          const val = cells[i];
          // Unwrap richText objects
          if (val && typeof val === 'object' && val.richText) {
            rowObj[key] = val.richText.map((rt: any) => rt.text).join('');
          } else if (val && typeof val === 'object' && val.text != null) {
            rowObj[key] = val.text;
          } else {
            rowObj[key] = val != null ? val : null;
          }
        }
      }
      yield rowObj;
    }
  }
}

export const importAc101Voters = async (): Promise<void> => {
  console.log(`[ImportAC101] Starting high-performance voter import for Gujarat AC 101...`);

  // 1. Resolve Gujarat AC 101 details from DB
  const acRes = await query(`
    SELECT ac.id as ac_id, ac.name as ac_name, ac.ac_number,
           pc.id as pc_id, pc.name as pc_name,
           d.id as district_id, d.name as district_name,
           s.id as state_id, s.name as state_name
    FROM assembly_constituencies ac
    JOIN parliamentary_constituencies pc ON ac.pc_id = pc.id
    JOIN districts d ON ac.district_id = d.id
    JOIN states s ON d.state_id = s.id
    WHERE ac.id = 'ee51a0f5-351c-47d4-adb6-ac88334344e8'
       OR (ac.ac_number = 101 AND LOWER(s.name) = 'gujarat' AND LOWER(d.name) = 'amreli')
    LIMIT 1;
  `);

  if (acRes.rows.length === 0) {
    throw new Error('Could not find Gujarat Assembly Constituency 101 in database.');
  }

  const acInfo = acRes.rows[0];
  console.log(`[ImportAC101] Target Constituency: ${acInfo.ac_name} (AC #${acInfo.ac_number}), PC: ${acInfo.pc_name}, District: ${acInfo.district_name}, State: ${acInfo.state_name}`);

  // 2. Ensure single Ward 1 exists for this AC
  console.log(`[ImportAC101] Ensuring single Ward 1 exists for ${acInfo.ac_name}...`);
  const wardRes = await query(`
    INSERT INTO wards (ac_id, ward_number, name)
    VALUES ($1, 1, 'Ward 1 - Gariyadhar')
    ON CONFLICT (ac_id, ward_number) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name, ward_number;
  `, [acInfo.ac_id]);
  const wardId = wardRes.rows[0].id;
  console.log(`[ImportAC101] Ward ready: '${wardRes.rows[0].name}' (ID: ${wardId})`);

  // 3. Provision Booths 1–276 and assign to Ward 1
  console.log(`[ImportAC101] Provisioning Booths 1 to 276 for ${acInfo.ac_name}...`);
  const boothRows = [];
  for (let num = 1; num <= 276; num++) {
    boothRows.push({
      ac_id: acInfo.ac_id,
      ward_id: wardId,
      booth_number: num,
      name: `Booth #${num} (${acInfo.ac_name})`,
      location_building: ``,
    });
  }

  await BatchInsertQuery.executeBatchImport(
    'booths',
    boothRows,
    ['ac_id', 'ward_id', 'booth_number', 'name', 'location_building'],
    {
      conflictTarget: ['ac_id', 'booth_number'],
      conflictStrategy: 'DO UPDATE',
      updateColumns: ['ward_id', 'name', 'location_building'],
    }
  );

  const existingBoothsRes = await query(`SELECT id, booth_number FROM booths WHERE ac_id = $1`, [acInfo.ac_id]);
  const existingBoothMap = new Map<number, string>();
  for (const b of existingBoothsRes.rows) {
    existingBoothMap.set(Number(b.booth_number), b.id);
  }
  console.log(`[ImportAC101] All ${existingBoothMap.size} booths ready for Ward 1.`);

  // 4. Stream the large Excel file row by row using ExcelJS streaming API
  console.log(`[ImportAC101] Streaming formatted Excel file (${sourceFile})...`);

  const BATCH_SIZE = 2000;
  let batch: Record<string, any>[] = [];
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalFailed = 0;
  let rowCount = 0;

  const truncateStr = (val: any, maxLen: number): string | null => {
    if (val === undefined || val === null || val === '') return null;
    const str = String(val).trim();
    return str.length > 0 ? str.substring(0, maxLen) : null;
  };

  const flushBatch = async (rows: Record<string, any>[]) => {
    const dbRows = rows.map((r) => {
      const boothNo = Number(r['Booth No'] || r['BoothNo'] || 1);
      const boothId = existingBoothMap.get(boothNo) || null;
      const relation = truncateStr(r['Relation'], 100);
      const guardianName = truncateStr(r['Guardian Name'], 255);

      return {
        epic_no: r['EPIC No'] ? String(r['EPIC No']).trim().toUpperCase() : '',
        state_id: acInfo.state_id,
        district_id: acInfo.district_id,
        pc_id: acInfo.pc_id,
        ac_id: acInfo.ac_id,
        ward_id: wardId,
        booth_id: boothId,
        serial_no: r['Serial No'] ? Number(r['Serial No']) : null,
        section_no: r['Section No'] ? Number(r['Section No']) : null,
        house_no: truncateStr(r['House No'], 100),
        first_name: truncateStr(r['First Name (Local)'], 150),
        middle_name: truncateStr(r['Middle Name (Local)'], 150),
        surname: truncateStr(r['Surname (Local)'], 150),
        relation,
        guardian_name: guardianName,
        gender: r['Gender'] ? String(r['Gender']).trim() : 'Other',
        age: r['Age'] ? Number(r['Age']) : null,
        dob: r['DOB'] || null,
        mobile_no: truncateStr(r['Mobile No'], 15),
        voter_type: truncateStr(r['Voter Type'], 50) || 'Voter',
        status: truncateStr(r['Status'], 20) || 'ACTIVE',
        is_dead: String(r['Is Dead'] || '').trim().toUpperCase() === 'YES',
        taluka: truncateStr(r['Taluka'], 150) || 'Gariadhar',
        village: truncateStr(r['Village'], 150),
        full_address: null,
        voter_address: r['Voter Address'] ? String(r['Voter Address']).trim() : null,
        is_family_influencer: false,
        is_social_influencer: false,
      };
    }).filter((r) => r.epic_no.length > 0);

    if (dbRows.length === 0) return;

    try {
      const res = await BatchInsertQuery.executeBatchImport(
        'voters',
        dbRows,
        [
          'epic_no', 'state_id', 'district_id', 'pc_id', 'ac_id', 'ward_id', 'booth_id',
          'serial_no', 'section_no', 'house_no', 'first_name', 'middle_name',
          'surname', 'relation', 'guardian_name', 'gender', 'age', 'dob', 'mobile_no',
          'voter_type', 'status', 'is_dead', 'taluka', 'village', 'full_address',
          'voter_address', 'is_family_influencer', 'is_social_influencer',
        ],
        {
          conflictTarget: ['epic_no'],
          conflictStrategy: 'DO UPDATE',
          updateColumns: [
            'ward_id', 'booth_id', 'serial_no', 'section_no', 'house_no',
            'first_name', 'middle_name', 'surname', 'relation', 'guardian_name',
            'gender', 'age', 'mobile_no', 'village', 'full_address', 'voter_address', 'status',
          ],
        }
      );
      totalInserted += res.insertedCount ?? dbRows.length;
    } catch (err) {
      totalFailed += dbRows.length;
      console.error(`\n[ImportAC101] Batch insert error:`, (err as Error).message);
    }

    totalProcessed += dbRows.length;
    process.stdout.write(`\r[ImportAC101] Streamed: ${rowCount} rows | Inserted: ${totalInserted} | Failed: ${totalFailed}   `);
  };

  for await (const row of streamExcelRows(sourceFile)) {
    rowCount++;
    batch.push(row);
    if (batch.length >= BATCH_SIZE) {
      await flushBatch(batch);
      batch = [];
    }
  }

  // Flush remaining rows
  if (batch.length > 0) {
    await flushBatch(batch);
  }

  console.log(`\n[ImportAC101] Import complete! Streamed: ${rowCount} rows | Inserted/Updated: ${totalInserted} | Failed: ${totalFailed}`);
  await CacheService.invalidatePattern('ranniti:voters*');
};

if (require.main === module) {
  importAc101Voters()
    .then(async () => {
      console.log('[ImportAC101] All operations completed.');
      await closeDbPool();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[ImportAC101] Error during import:', err);
      await closeDbPool();
      process.exit(1);
    });
}
