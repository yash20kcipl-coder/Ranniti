import { Pool } from 'pg';

export class VolunteerAssignedBoothService {
  /**
   * Get assigned booth details for volunteer
   */
  static async getAssignedBooths(tenantPool: Pool, assignedBoothIds: string[]): Promise<any[]> {
    if (!assignedBoothIds || assignedBoothIds.length === 0) return [];
    const res = await tenantPool.query(
      `SELECT * FROM booths WHERE id = ANY($1) ORDER BY booth_number ASC`,
      [assignedBoothIds]
    );
    return res.rows;
  }
}
