import { ApiError } from '../../utils/apiError';
import { UserRecord } from '../../queries/auth.queries';
import { TenantPoolManager } from '../pool/tenantPoolManager';
import { MobileElectionQueries, MobilePollingVotersResult } from '../../queries/mobileElection.queries';

export class MobileElectionService {
  /**
   * Get booth voters list with polling turnout status
   */
  async getPollingVoters(
    user: Omit<UserRecord, 'passwordHash'>,
    params: {
      boothId?: string;
      electionId?: string;
      search?: string;
      serialNo?: number;
      hasVoted?: 'all' | 'voted' | 'not_voted';
      page?: number;
      limit?: number;
    }
  ): Promise<MobilePollingVotersResult> {
    if (!user.tenantDbName) {
      throw ApiError.badRequest('Tenant database configuration missing');
    }

    // Determine target boothId with strict scope validation
    let targetBoothId = params.boothId;

    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      if (targetBoothId) {
        if (!user.assignedBoothIds.includes(targetBoothId)) {
          throw ApiError.forbidden('Access denied: Booth is outside your assigned scope');
        }
      } else {
        targetBoothId = user.assignedBoothIds[0];
      }
    }

    if (!targetBoothId) {
      throw ApiError.badRequest('Polling booth ID is required to access election voter list');
    }

    const pool = TenantPoolManager.getPool(user.tenantDbName);
    return await MobileElectionQueries.getMobilePollingVoters(pool, {
      ...params,
      boothId: targetBoothId,
    });
  }

  /**
   * Single-tap mark voter as voted / unvoted
   */
  async markVoterStatus(
    user: Omit<UserRecord, 'passwordHash'>,
    payload: {
      voterId: string;
      electionId?: string;
      boothId?: string;
      hasVoted: boolean;
    }
  ) {
    if (!user.tenantDbName) {
      throw ApiError.badRequest('Tenant database configuration missing');
    }

    if (!payload.voterId) {
      throw ApiError.badRequest('Voter ID is required');
    }

    // Verify booth scoping if boothId is provided
    if (payload.boothId && user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      if (!user.assignedBoothIds.includes(payload.boothId)) {
        throw ApiError.forbidden('Access denied: Voter booth is outside your assigned scope');
      }
    }

    const pool = TenantPoolManager.getPool(user.tenantDbName);
    return await MobileElectionQueries.recordMobileVoterStatus(pool, {
      ...payload,
      markedByUserId: user.id,
    });
  }

  /**
   * Batch sync offline queued votes
   */
  async batchSyncVotes(
    user: Omit<UserRecord, 'passwordHash'>,
    payload: {
      electionId?: string;
      items: Array<{
        voterId: string;
        boothId?: string;
        hasVoted: boolean;
        votedAt?: string;
      }>;
    }
  ) {
    if (!user.tenantDbName) {
      throw ApiError.badRequest('Tenant database configuration missing');
    }

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw ApiError.badRequest('Items array cannot be empty');
    }

    // Security check: restrict each item if assignedBoothIds is populated
    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      for (const item of payload.items) {
        if (item.boothId && !user.assignedBoothIds.includes(item.boothId)) {
          throw ApiError.forbidden(`Access denied: Booth '${item.boothId}' is outside your assigned scope`);
        }
      }
    }

    const pool = TenantPoolManager.getPool(user.tenantDbName);
    return await MobileElectionQueries.batchSyncMobileVoterStatus(pool, payload);
  }

  /**
   * Get booth turnout analytics
   */
  async getBoothTurnout(
    user: Omit<UserRecord, 'passwordHash'>,
    electionId: string,
    boothId: string
  ) {
    if (!user.tenantDbName) {
      throw ApiError.badRequest('Tenant database configuration missing');
    }

    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      if (!user.assignedBoothIds.includes(boothId)) {
        throw ApiError.forbidden('Access denied: Booth is outside your assigned scope');
      }
    }

    const pool = TenantPoolManager.getPool(user.tenantDbName);
    return await MobileElectionQueries.getMobileBoothTurnout(pool, electionId, boothId);
  }

  /**
   * Get approved WhatsApp message templates with election and campaign context
   */
  async getWhatsAppTemplates(user: Omit<UserRecord, 'passwordHash'>) {
    if (!user.tenantDbName) {
      throw ApiError.badRequest('Tenant database configuration missing');
    }
    const pool = TenantPoolManager.getPool(user.tenantDbName);
    return await MobileElectionQueries.getMobileWhatsAppTemplates(pool);
  }
}

export const mobileElectionService = new MobileElectionService();
