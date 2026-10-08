import { query } from '../../queries/dbPool';
import { UserRecord } from '../../queries/auth.queries';
import { TenantPoolManager } from '../../utils/tenantPoolManager';
import { sanitizeIndianContacts, SanitizedContact } from '../../utils/indianPhoneSanitizer';

export interface MatchedVoterItem {
  voterId: string;
  epicNo: string;
  name: string;
  mobileNo: string | null;
  deviceContactName: string;
  devicePhone: string;
  email: string | null;
  boothName: string | null;
  boothNo: string | null;
  houseNo: string | null;
  village: string | null;
  voterType: string | null;
  status: string | null;
  avatar: string | null;
  syncedAt?: string;
}

export interface SyncContactResult {
  totalSubmitted: number;
  validIndianMobiles: number;
  totalMatched: number;
  matchedVoters: MatchedVoterItem[];
}

export interface GetSyncedContactsOptions {
  page?: number;
  limit?: number;
  search?: string;
  boothId?: string;
  voterType?: string;
}

export interface GetSyncedContactsResult {
  items: MatchedVoterItem[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export class MobileContactSyncService {
  /**
   * Ultra-fast batch phone contact sync optimized for Indian electoral roll scale.
   * Leverages PostgreSQL functional B-Tree index on voters mobile number and UNNEST join.
   */
  async syncContacts(
    user: Omit<UserRecord, 'passwordHash'>,
    rawContacts: Array<{ name?: string; phone?: string } | string>,
    emails: string[] = []
  ): Promise<SyncContactResult> {
    const totalSubmitted = Array.isArray(rawContacts) ? rawContacts.length : 0;
    const sanitized: SanitizedContact[] = sanitizeIndianContacts(rawContacts);
    const cleanEmails: string[] = Array.from(
      new Set(emails.map(e => e.toLowerCase().trim()).filter(Boolean))
    );

    if (sanitized.length === 0 && cleanEmails.length === 0) {
      return {
        totalSubmitted,
        validIndianMobiles: 0,
        totalMatched: 0,
        matchedVoters: [],
      };
    }

    const phones = sanitized.map(s => s.phone);
    const names = sanitized.map(s => s.contactName);

    const conditions: string[] = [];
    const values: any[] = [phones, names];
    let paramIndex = 3;

    // Scope to assigned booth IDs or AC ID for the worker
    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      conditions.push(`v.booth_id = ANY($${paramIndex}::uuid[])`);
      values.push(user.assignedBoothIds);
      paramIndex++;
    } else if (user.assignedAcId) {
      conditions.push(`v.ac_id = $${paramIndex}`);
      values.push(user.assignedAcId);
      paramIndex++;
    }

    const additionalWhere = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const sqlStr = `
      WITH submitted_contacts AS (
        SELECT u.phone, u.contact_name
        FROM UNNEST($1::text[], $2::text[]) AS u(phone, contact_name)
      )
      SELECT 
        v.id AS "voterId",
        v.epic_no AS "epicNo",
        CONCAT_WS(' ', NULLIF(v.eng_first_name, ''), NULLIF(v.eng_surname, '')) AS "name",
        v.mobile_no AS "mobileNo",
        sc.contact_name AS "deviceContactName",
        sc.phone AS "devicePhone",
        v.email AS "email",
        b.name AS "boothName",
        b.booth_number::text AS "boothNo",
        v.house_no AS "houseNo",
        v.village AS "village",
        v.voter_type AS "voterType",
        v.status AS "status",
        v.avatar AS "avatar"
      FROM submitted_contacts sc
      INNER JOIN voters v 
        ON RIGHT(REGEXP_REPLACE(v.mobile_no, '\\D', '', 'g'), 10) = sc.phone
      LEFT JOIN booths b ON b.id = v.booth_id
      WHERE 1=1 ${additionalWhere}
      ORDER BY v.eng_first_name ASC
      LIMIT 2000
    `;

    let rows: MatchedVoterItem[] = [];
    if (user.tenantDbName && user.tenantDbName.trim()) {
      const res = await TenantPoolManager.query(user.tenantDbName.trim(), sqlStr, values);
      rows = res.rows;
    } else {
      const res = await query(sqlStr, values);
      rows = res.rows;
    }

    // Record matched voter contacts for this mobile user in user_synced_contacts table via single vectorized UNNEST upsert
    if (rows.length > 0 && user.id) {
      try {
        const voterIds = rows.map(r => r.voterId);
        const contactNames = rows.map(r => r.deviceContactName);
        const contactPhones = rows.map(r => r.devicePhone);

        const upsertSql = `
          INSERT INTO user_synced_contacts (user_id, voter_id, contact_name, contact_phone, synced_at, updated_at)
          SELECT $1, u.voter_id, u.contact_name, u.contact_phone, NOW(), NOW()
          FROM UNNEST($2::uuid[], $3::varchar[], $4::varchar[]) AS u(voter_id, contact_name, contact_phone)
          ON CONFLICT (user_id, voter_id) DO UPDATE SET
            contact_name = EXCLUDED.contact_name,
            contact_phone = EXCLUDED.contact_phone,
            updated_at = NOW()
        `;
        const upsertParams = [user.id, voterIds, contactNames, contactPhones];

        if (user.tenantDbName && user.tenantDbName.trim()) {
          await TenantPoolManager.query(user.tenantDbName.trim(), upsertSql, upsertParams);
        } else {
          await query(upsertSql, upsertParams);
        }
      } catch (insertErr) {
        // Non-blocking sync record failure handling
      }
    }

    return {
      totalSubmitted,
      validIndianMobiles: sanitized.length,
      totalMatched: rows.length,
      matchedVoters: rows,
    };
  }

  /**
   * Retrieves paginated list of synced voters for the authenticated mobile worker.
   */
  async getSyncedContacts(
    user: Omit<UserRecord, 'passwordHash'>,
    options: GetSyncedContactsOptions = {}
  ): Promise<GetSyncedContactsResult> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['usc.user_id = $1'];
    const values: any[] = [user.id];
    let paramIndex = 2;

    if (options.search && options.search.trim()) {
      const term = `%${options.search.trim()}%`;
      conditions.push(`(
        v.eng_first_name ILIKE $${paramIndex} 
        OR v.eng_surname ILIKE $${paramIndex}
        OR usc.contact_name ILIKE $${paramIndex}
        OR v.epic_no ILIKE $${paramIndex}
        OR v.mobile_no ILIKE $${paramIndex}
        OR usc.contact_phone ILIKE $${paramIndex}
      )`);
      values.push(term);
      paramIndex++;
    }

    if (options.boothId && options.boothId.trim()) {
      conditions.push(`v.booth_id = $${paramIndex}`);
      values.push(options.boothId.trim());
      paramIndex++;
    }

    if (options.voterType && options.voterType.trim()) {
      conditions.push(`v.voter_type = $${paramIndex}`);
      values.push(options.voterType.trim());
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM user_synced_contacts usc
      INNER JOIN voters v ON v.id = usc.voter_id
      ${whereClause}
    `;

    const dataSql = `
      SELECT 
        usc.id AS "syncId",
        usc.voter_id AS "voterId",
        usc.contact_name AS "deviceContactName",
        usc.contact_phone AS "devicePhone",
        usc.synced_at AS "syncedAt",
        v.epic_no AS "epicNo",
        CONCAT_WS(' ', NULLIF(v.eng_first_name, ''), NULLIF(v.eng_surname, '')) AS "englishName",
        CONCAT_WS(' ', NULLIF(v.first_name, ''), NULLIF(v.surname, '')) AS "hindiName",
        COALESCE(
          NULLIF(CONCAT_WS(' ', NULLIF(v.first_name, ''), NULLIF(v.surname, '')), ''),
          NULLIF(CONCAT_WS(' ', NULLIF(v.eng_first_name, ''), NULLIF(v.eng_surname, '')), '')
        ) AS "name",
        v.mobile_no AS "mobileNo",
        v.email AS "email",
        b.name AS "boothName",
        b.booth_number::text AS "boothNo",
        v.house_no AS "houseNo",
        v.village AS "village",
        v.voter_type AS "voterType",
        v.status AS "status",
        v.avatar AS "avatar"
      FROM user_synced_contacts usc
      INNER JOIN voters v ON v.id = usc.voter_id
      LEFT JOIN booths b ON b.id = v.booth_id
      ${whereClause}
      ORDER BY usc.synced_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataValues = [...values, limit, offset];

    let totalRecords = 0;
    let items: MatchedVoterItem[] = [];

    if (user.tenantDbName && user.tenantDbName.trim()) {
      const [countRes, dataRes] = await Promise.all([
        TenantPoolManager.query(user.tenantDbName.trim(), countSql, values),
        TenantPoolManager.query(user.tenantDbName.trim(), dataSql, dataValues),
      ]);
      totalRecords = countRes.rows[0]?.count || 0;
      items = dataRes.rows;
    } else {
      const [countRes, dataRes] = await Promise.all([
        query(countSql, values),
        query(dataSql, dataValues),
      ]);
      totalRecords = countRes.rows[0]?.count || 0;
      items = dataRes.rows;
    }

    return {
      items,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit) || 1,
      },
    };
  }

  /**
   * Unlinks / removes a synced voter from the mobile worker's contact list.
   */
  async removeSyncedContact(
    user: Omit<UserRecord, 'passwordHash'>,
    voterId: string
  ): Promise<boolean> {
    const deleteSql = `
      DELETE FROM user_synced_contacts
      WHERE user_id = $1 AND voter_id = $2
    `;
    const deleteParams = [user.id, voterId];

    if (user.tenantDbName && user.tenantDbName.trim()) {
      const res = await TenantPoolManager.query(user.tenantDbName.trim(), deleteSql, deleteParams);
      return (res.rowCount ?? 0) > 0;
    } else {
      const res = await query(deleteSql, deleteParams);
      return (res.rowCount ?? 0) > 0;
    }
  }
}

export const mobileContactSyncService = new MobileContactSyncService();
