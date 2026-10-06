import { query } from '../../queries/dbPool';
import { UserRecord } from '../../queries/auth.queries';
import { TenantPoolManager } from '../../utils/tenantPoolManager';

export interface SyncContactResult {
  totalMatched: number;
  matchedVoters: Array<{
    voterId: string;
    epicNo: string;
    name: string;
    mobileNo: string | null;
    email: string | null;
    boothNo: string | null;
    houseNo: string | null;
    village: string | null;
    voterType: string | null;
    avatar: string | null;
  }>;
}

export class MobileContactSyncService {
  async syncContacts(
    user: Omit<UserRecord, 'passwordHash'>,
    phoneNumbers: string[],
    emails: string[] = []
  ): Promise<SyncContactResult> {
    const cleanNumbers: string[] = Array.from(
      new Set(
        phoneNumbers
          .map(p => p.replace(/\D/g, ''))
          .map(p => (p.length >= 10 ? p.slice(-10) : p))
          .filter(p => p.length >= 7)
      )
    );

    const cleanEmails: string[] = Array.from(
      new Set(emails.map(e => e.toLowerCase().trim()).filter(Boolean))
    );

    if (cleanNumbers.length === 0 && cleanEmails.length === 0) {
      return { totalMatched: 0, matchedVoters: [] };
    }

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const matchConditions: string[] = [];
    if (cleanNumbers.length > 0) {
      matchConditions.push(`RIGHT(v.mobile_no, 10) = ANY($${paramIndex})`);
      values.push(cleanNumbers);
      paramIndex++;
    }

    if (cleanEmails.length > 0) {
      matchConditions.push(`LOWER(v.email) = ANY($${paramIndex})`);
      values.push(cleanEmails);
      paramIndex++;
    }

    conditions.push(`(${matchConditions.join(' OR ')})`);

    // Scope to assigned booth IDs or AC ID
    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      conditions.push(`v.booth_id = ANY($${paramIndex}::uuid[])`);
      values.push(user.assignedBoothIds);
      paramIndex++;
    } else if (user.assignedAcId) {
      conditions.push(`v.ac_id = $${paramIndex}`);
      values.push(user.assignedAcId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sqlStr = `
      SELECT 
        v.id AS "voterId",
        v.epic_no AS "epicNo",
        CONCAT_WS(' ', NULLIF(v.eng_first_name, ''), NULLIF(v.eng_surname, '')) AS "name",
        v.mobile_no AS "mobileNo",
        v.email AS "email",
        b.name AS "boothName",
        b.booth_number::text AS "boothNo",
        v.house_no AS "houseNo",
        v.village AS "village",
        v.voter_type AS "voterType",
        v.avatar AS "avatar"
      FROM voters v
      LEFT JOIN booths b ON b.id = v.booth_id
      ${whereClause}
      ORDER BY v.eng_first_name ASC
      LIMIT 200
    `;

    let rows: any[] = [];
    if (user.tenantDbName && user.tenantDbName.trim()) {
      const res = await TenantPoolManager.query(user.tenantDbName.trim(), sqlStr, values);
      rows = res.rows;
    } else {
      const res = await query(sqlStr, values);
      rows = res.rows;
    }

    // Record matched voter contacts for this mobile user in user_synced_contacts table
    if (rows.length > 0 && user.id) {
      try {
        const insertValues: any[] = [];
        const valuePlaceholders: string[] = [];
        let pIdx = 1;
        for (const r of rows) {
          valuePlaceholders.push(`($${pIdx}, $${pIdx + 1})`);
          insertValues.push(user.id, r.voterId);
          pIdx += 2;
        }
        const insertSql = `
          INSERT INTO user_synced_contacts (user_id, voter_id)
          VALUES ${valuePlaceholders.join(', ')}
          ON CONFLICT (user_id, voter_id) DO NOTHING
        `;
        if (user.tenantDbName && user.tenantDbName.trim()) {
          await TenantPoolManager.query(user.tenantDbName.trim(), insertSql, insertValues);
        } else {
          await query(insertSql, insertValues);
        }
      } catch (insertErr) {
        // Non-blocking sync record
      }
    }

    return {
      totalMatched: rows.length,
      matchedVoters: rows,
    };
  }
}

export const mobileContactSyncService = new MobileContactSyncService();
