import { logger } from '../../utils/logger';
import { query } from '../../queries/dbPool';
import { UserRecord } from '../../queries/auth.queries';
import { TenantPoolManager } from '../pool/tenantPoolManager';

export interface LogInteractionPayload {
  voterId?: string;
  boothId?: string;
  activityType: 'call' | 'whatsapp' | 'sms';
  metadata?: Record<string, any>;
}

export class MobileInteractionService {
  /**
   * Asynchronously records volunteer outreach events (Call, WhatsApp, SMS).
   */
  async logInteraction(
    user: Omit<UserRecord, 'passwordHash'>,
    payload: LogInteractionPayload
  ): Promise<{ logged: boolean; id?: string }> {
    const { voterId, boothId, activityType, metadata = {} } = payload;

    if (!activityType || !['call', 'whatsapp', 'sms'].includes(activityType)) {
      throw new Error("Invalid activityType. Must be 'call', 'whatsapp', or 'sms'.");
    }

    const insertSql = `
      INSERT INTO volunteer_activity_logs (
        volunteer_id, voter_id, booth_id, activity_type, metadata, created_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, created_at
    `;
    const params = [
      user.id,
      voterId || null,
      boothId || null,
      activityType,
      JSON.stringify(metadata),
    ];

    try {
      let res;
      if (user.tenantDbName && user.tenantDbName.trim()) {
        res = await TenantPoolManager.query(user.tenantDbName.trim(), insertSql, params);
      } else {
        res = await query(insertSql, params);
      }
      return { logged: true, id: res.rows[0]?.id };
    } catch (err) {
      logger.error('Failed to log volunteer activity:', err);
      return { logged: false };
    }
  }
}

export const mobileInteractionService = new MobileInteractionService();
