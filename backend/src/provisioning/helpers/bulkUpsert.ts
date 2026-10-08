import { Pool } from 'pg';

/**
 * Shared bulk-insert helper
 * Builds a single multi-row VALUES statement to replace N sequential inserts.
 * Chunk size kept at 500 rows to stay safely below PostgreSQL's 65535 parameter limit.
 */
export async function bulkUpsert(
  pool: Pool,
  tableName: string,
  columns: string[],
  rows: Record<string, any>[],
  conflictKey = 'id'
): Promise<void> {
  if (!rows.length) return;

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const colNames = columns.map((c) => `"${c}"`).join(', ');
    const valueTuples: string[] = [];
    const params: any[] = [];
    let p = 1;

    for (const row of chunk) {
      const placeholders = columns.map(() => `$${p++}`).join(', ');
      valueTuples.push(`(${placeholders})`);
      for (const col of columns) params.push(row[col] ?? null);
    }

    const updateCols = columns
      .filter((c) => c !== conflictKey && c !== 'created_at')
      .map((c) => `"${c}" = EXCLUDED."${c}"`)
      .join(', ');

    const conflictClause = updateCols
      ? `ON CONFLICT (${conflictKey}) DO UPDATE SET ${updateCols}`
      : `ON CONFLICT (${conflictKey}) DO NOTHING`;

    await pool.query(
      `INSERT INTO ${tableName} (${colNames}) VALUES ${valueTuples.join(', ')} ${conflictClause}`,
      params
    );
  }
}
