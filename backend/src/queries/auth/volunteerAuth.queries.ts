import { query as masterQuery } from '../dbPool';
import { TenantPoolManager } from '../../utils/tenantPoolManager';

export interface VolunteerUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'pc_leader' | 'ac_leader' | 'sub_leader' | 'supporter' | string;
  roleName?: string | null;
  mobile?: string;
  avatar?: string;
  status: string;
  tenantDbName: string;
  parentLeaderId?: string | null;
  assignedAcId?: string | null;
  assignedBoothIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class VolunteerAuthQueries {
  static async getVolunteerAssignedBoothIds(userId: string, tenantDbName: string): Promise<string[]> {
    try {
      const res = await TenantPoolManager.query(
        tenantDbName,
        `SELECT booth_id FROM user_booth_assignments WHERE user_id = $1`,
        [userId]
      );
      return res.rows.map((row: { booth_id: string }) => row.booth_id);
    } catch {
      return [];
    }
  }

  static async assignBoothsToVolunteer(userId: string, boothIds: string[], tenantDbName: string): Promise<void> {
    if (!tenantDbName) return;
    await TenantPoolManager.query(tenantDbName, `DELETE FROM user_booth_assignments WHERE user_id = $1`, [userId]);
    if (boothIds && boothIds.length > 0) {
      for (const boothId of boothIds) {
        await TenantPoolManager.query(
          tenantDbName,
          `INSERT INTO user_booth_assignments (user_id, booth_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, boothId]
        );
      }
    }
  }

  static async findVolunteerByIdentifier(identifier: string, tenantDbName?: string | null): Promise<VolunteerUserRecord | null> {
    const cleanIdentifier = identifier.toLowerCase().trim();
    const sql = `
      SELECT id, name, email, password_hash AS "passwordHash", 
             role, role_name AS "roleName", mobile, avatar, status, tenant_db_name AS "tenantDbName",
             parent_leader_id AS "parentLeaderId", assigned_ac_id AS "assignedAcId",
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM tenant_users 
      WHERE LOWER(email) = $1 OR mobile = $1
    `;

    if (tenantDbName && tenantDbName.trim()) {
      try {
        const res = await TenantPoolManager.query(tenantDbName.trim(), sql, [cleanIdentifier]);
        if (res.rows[0]) {
          const user = res.rows[0];
          user.tenantDbName = tenantDbName.trim();
          user.assignedBoothIds = await this.getVolunteerAssignedBoothIds(user.id, user.tenantDbName);
          return user;
        }
      } catch {
        // Fallback
      }
    }

    const tenantRes = await masterQuery(
      `SELECT tenant_db_name FROM tenants WHERE status IN ('ready', 'active') AND tenant_db_name IS NOT NULL`
    );

    for (const tRow of tenantRes.rows) {
      const dbName = tRow.tenant_db_name;
      try {
        const res = await TenantPoolManager.query(dbName, sql, [cleanIdentifier]);
        if (res.rows[0]) {
          const user = res.rows[0];
          user.tenantDbName = dbName;
          user.assignedBoothIds = await this.getVolunteerAssignedBoothIds(user.id, dbName);
          return user;
        }
      } catch {
        // Continue searching other tenant DBs
      }
    }
    return null;
  }

  static async findVolunteerById(id: string, tenantDbName?: string | null): Promise<VolunteerUserRecord | null> {
    const sql = `
      SELECT id, name, email, password_hash AS "passwordHash", 
             role, role_name AS "roleName", mobile, avatar, status, tenant_db_name AS "tenantDbName",
             parent_leader_id AS "parentLeaderId", assigned_ac_id AS "assignedAcId",
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM tenant_users WHERE id = $1
    `;

    if (tenantDbName && tenantDbName.trim()) {
      try {
        const res = await TenantPoolManager.query(tenantDbName.trim(), sql, [id]);
        if (res.rows[0]) {
          const user = res.rows[0];
          user.tenantDbName = tenantDbName.trim();
          user.assignedBoothIds = await this.getVolunteerAssignedBoothIds(user.id, user.tenantDbName);
          return user;
        }
      } catch {
        // Fallback
      }
    }

    const tenantRes = await masterQuery(
      `SELECT tenant_db_name FROM tenants WHERE status IN ('ready', 'active') AND tenant_db_name IS NOT NULL`
    );

    for (const tRow of tenantRes.rows) {
      const dbName = tRow.tenant_db_name;
      try {
        const res = await TenantPoolManager.query(dbName, sql, [id]);
        if (res.rows[0]) {
          const user = res.rows[0];
          user.tenantDbName = dbName;
          user.assignedBoothIds = await this.getVolunteerAssignedBoothIds(user.id, dbName);
          return user;
        }
      } catch {
        // Continue
      }
    }
    return null;
  }

  static async createVolunteer(
    data: {
      name: string;
      email: string;
      passwordHash: string;
      role: string;
      roleName?: string | null;
      mobile?: string;
      avatar?: string | null;
      parentLeaderId?: string | null;
      assignedAcId?: string | null;
      assignedBoothIds?: string[];
    },
    tenantDbName: string
  ): Promise<VolunteerUserRecord> {
    let validParentLeaderId: string | null = null;
    if (data.parentLeaderId && data.parentLeaderId !== 'null') {
      try {
        const parentCheck = await TenantPoolManager.query(
          tenantDbName,
          `SELECT id FROM tenant_users WHERE id = $1 LIMIT 1`,
          [data.parentLeaderId]
        );
        if (parentCheck.rows.length > 0) {
          validParentLeaderId = data.parentLeaderId;
        }
      } catch {
        validParentLeaderId = null;
      }
    }

    const ROLE_NAME_MAP: Record<string, string> = {
      pc_leader: 'PC Leader',
      ac_leader: 'AC Leader',
      sub_leader: 'Sub-Leader / Ward Coordinator',
      supporter: 'Campaign Supporter / Volunteer',
      leader: 'Assembly / Sub-Sector Leader',
    };
    const effectiveRoleName =
      data.roleName && (data.role === 'supporter' || data.roleName !== 'Campaign Supporter / Volunteer')
        ? data.roleName
        : (ROLE_NAME_MAP[data.role] || data.roleName || null);

    const res = await TenantPoolManager.query(
      tenantDbName,
      `INSERT INTO tenant_users (name, email, password_hash, role, role_name, mobile, avatar, tenant_db_name, parent_leader_id, assigned_ac_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, email, password_hash AS "passwordHash", 
                 role, role_name AS "roleName", mobile, avatar, status, tenant_db_name AS "tenantDbName",
                 parent_leader_id AS "parentLeaderId", assigned_ac_id AS "assignedAcId",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.name,
        data.email.toLowerCase().trim(),
        data.passwordHash,
        data.role,
        effectiveRoleName,
        data.mobile || null,
        data.avatar || null,
        tenantDbName,
        validParentLeaderId,
        data.assignedAcId || null,
      ]
    );
    const user = res.rows[0];
    user.tenantDbName = tenantDbName;
    if (data.assignedBoothIds && data.assignedBoothIds.length > 0) {
      await this.assignBoothsToVolunteer(user.id, data.assignedBoothIds, tenantDbName);
      user.assignedBoothIds = data.assignedBoothIds;
    } else {
      user.assignedBoothIds = [];
    }
    return user;
  }

  static async updateVolunteerProfile(
    id: string,
    data: { name?: string; mobile?: string; avatar?: string; status?: string; role?: string; roleName?: string; assignedAcId?: string; parentLeaderId?: string; assignedBoothIds?: string[] },
    tenantDbName: string
  ): Promise<VolunteerUserRecord> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    const ROLE_NAME_MAP: Record<string, string> = {
      pc_leader: 'PC Leader',
      ac_leader: 'AC Leader',
      sub_leader: 'Sub-Leader / Ward Coordinator',
      supporter: 'Campaign Supporter / Volunteer',
      leader: 'Assembly / Sub-Sector Leader',
    };

    if (data.name !== undefined) {
      fields.push(`name = $${paramIdx++}`);
      params.push(data.name);
    }
    if (data.mobile !== undefined) {
      fields.push(`mobile = $${paramIdx++}`);
      params.push(data.mobile);
    }
    if (data.avatar !== undefined) {
      fields.push(`avatar = $${paramIdx++}`);
      params.push(data.avatar);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramIdx++}`);
      params.push(data.status);
    }
    if (data.role !== undefined) {
      fields.push(`role = $${paramIdx++}`);
      params.push(data.role);
    }
    if (data.roleName !== undefined) {
      fields.push(`role_name = $${paramIdx++}`);
      params.push(data.roleName);
    } else if (data.role !== undefined) {
      fields.push(`role_name = $${paramIdx++}`);
      params.push(ROLE_NAME_MAP[data.role] || data.role);
    }
    if (data.assignedAcId !== undefined) {
      fields.push(`assigned_ac_id = $${paramIdx++}`);
      params.push(data.assignedAcId || null);
    }
    if (data.parentLeaderId !== undefined) {
      let validParentLeaderId: string | null = null;
      if (data.parentLeaderId && data.parentLeaderId !== 'null') {
        try {
          const parentCheck = await TenantPoolManager.query(
            tenantDbName,
            `SELECT id FROM tenant_users WHERE id = $1 LIMIT 1`,
            [data.parentLeaderId]
          );
          if (parentCheck.rows.length > 0) {
            validParentLeaderId = data.parentLeaderId;
          }
        } catch {
          validParentLeaderId = null;
        }
      }
      fields.push(`parent_leader_id = $${paramIdx++}`);
      params.push(validParentLeaderId);
    }

    if (data.assignedBoothIds !== undefined && Array.isArray(data.assignedBoothIds)) {
      await this.assignBoothsToVolunteer(id, data.assignedBoothIds, tenantDbName);
    }

    if (fields.length > 0) {
      fields.push(`updated_at = NOW()`);
      params.push(id);
      await TenantPoolManager.query(
        tenantDbName,
        `UPDATE tenant_users SET ${fields.join(', ')} WHERE id = $${paramIdx}`,
        params
      );
    }
    const updated = await this.findVolunteerById(id, tenantDbName);
    return updated!;
  }
}
