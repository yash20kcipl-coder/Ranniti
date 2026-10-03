import { query } from '../../queries/dbPool';
import { logger } from '../../utils/logger';

export interface AuditLogPayload {
  userId?: string | null;
  tenantId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditLoggerService {
  /**
   * Log security or administrative action to audit_logs in Master DB
   */
  static async log(payload: AuditLogPayload): Promise<void> {
    try {
      const sql = `
        INSERT INTO audit_logs (
          user_id, tenant_id, action, entity_type, entity_id, details, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      const params = [
        payload.userId || null,
        payload.tenantId || null,
        payload.action,
        payload.entityType || null,
        payload.entityId || null,
        payload.details ? JSON.stringify(payload.details) : null,
        payload.ipAddress || null,
        payload.userAgent || null,
      ];

      await query(sql, params);
    } catch (err: any) {
      // Never crash main workflow due to audit logging failure, log to stderr
      logger.error(`[AuditLoggerService] Failed to record audit log '${payload.action}':`, err);
    }
  }
}
