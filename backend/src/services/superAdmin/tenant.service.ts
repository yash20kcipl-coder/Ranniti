import { query } from '../../queries/dbPool';

export class SuperAdminTenantService {
  /**
   * Get all tenant profiles & provisioning statuses
   */
  static async getAllTenants(): Promise<any[]> {
    const res = await query(`
      SELECT ta.*, u.name AS user_name, u.email AS user_email
      FROM tenant_assignments ta
      LEFT JOIN admin_users u ON ta.user_id = u.id
      ORDER BY ta.created_at DESC
    `);
    return res.rows;
  }

  /**
   * Get provisioning status for a specific tenant user
   */
  static async getTenantStatus(userId: string): Promise<any> {
    const res = await query(`SELECT * FROM tenant_assignments WHERE user_id = $1`, [userId]);
    return res.rows[0] || null;
  }

}
