import { logger } from '../../utils/logger';
import { query as masterQuery } from '../../queries/dbPool';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { superAdminElectionQueries, SuperAdminElectionRecord } from '../../queries/superAdminElection.queries';

export class ElectionSyncService {
  /**
   * Idempotently syncs an election record into a tenant database
   */
  static async syncElectionToTenantDb(
    tenantDbName: string,
    election: SuperAdminElectionRecord
  ): Promise<void> {
    if (!tenantDbName) return;
    const pool = getTenantDbPool(tenantDbName);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Safety guarantee: Ensure referenced state, PC, and AC exist in tenant DB before inserting election
      let safeStateId = election.stateId;
      if (safeStateId) {
        const stateCheck = await client.query('SELECT 1 FROM states WHERE id = $1', [safeStateId]);
        if (!stateCheck.rows.length) {
          const mState = await masterQuery('SELECT id, name, created_at, updated_at FROM states WHERE id = $1', [safeStateId]);
          if (mState.rows.length) {
            await client.query('INSERT INTO states (id, name, created_at, updated_at) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING;', [
              mState.rows[0].id, mState.rows[0].name, mState.rows[0].created_at, mState.rows[0].updated_at
            ]);
          } else {
            safeStateId = null;
          }
        }
      }

      let safePcId = election.pcId;
      if (safePcId) {
        const pcCheck = await client.query('SELECT 1 FROM parliamentary_constituencies WHERE id = $1', [safePcId]);
        if (!pcCheck.rows.length) {
          const mPc = await masterQuery('SELECT id, state_id, pc_number, name, created_at, updated_at FROM parliamentary_constituencies WHERE id = $1', [safePcId]);
          if (mPc.rows.length) {
            await client.query('INSERT INTO parliamentary_constituencies (id, state_id, pc_number, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING;', [
              mPc.rows[0].id, mPc.rows[0].state_id, mPc.rows[0].pc_number, mPc.rows[0].name, mPc.rows[0].created_at, mPc.rows[0].updated_at
            ]);
          } else {
            safePcId = null;
          }
        }
      }

      let safeAcId = election.acId;
      if (safeAcId) {
        const acCheck = await client.query('SELECT 1 FROM assembly_constituencies WHERE id = $1', [safeAcId]);
        if (!acCheck.rows.length) {
          const mAc = await masterQuery('SELECT id, pc_id, district_id, ac_number, name, created_at, updated_at FROM assembly_constituencies WHERE id = $1', [safeAcId]);
          if (mAc.rows.length) {
            await client.query('INSERT INTO assembly_constituencies (id, pc_id, district_id, ac_number, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING;', [
              mAc.rows[0].id, mAc.rows[0].pc_id, mAc.rows[0].district_id, mAc.rows[0].ac_number, mAc.rows[0].name, mAc.rows[0].created_at, mAc.rows[0].updated_at
            ]);
          } else {
            safeAcId = null;
          }
        }
      }

      // Check if this tenant currently has any default election
      const defCheck = await client.query(
        `SELECT id FROM elections WHERE is_default = true LIMIT 1;`
      );
      const hasDefault = Boolean(defCheck.rows.length);

      const upsertSql = `
        INSERT INTO elections (
          id, name, election_code, election_type, election_date, counting_date,
          state_id, pc_id, ac_id, is_active, is_default, status,
          total_voters_snapshot, target_votes, description, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          election_code = EXCLUDED.election_code,
          election_type = EXCLUDED.election_type,
          election_date = EXCLUDED.election_date,
          counting_date = EXCLUDED.counting_date,
          state_id = EXCLUDED.state_id,
          pc_id = EXCLUDED.pc_id,
          ac_id = EXCLUDED.ac_id,
          is_active = EXCLUDED.is_active,
          status = EXCLUDED.status,
          total_voters_snapshot = EXCLUDED.total_voters_snapshot,
          target_votes = EXCLUDED.target_votes,
          description = EXCLUDED.description,
          updated_at = NOW();
      `;

      await client.query(upsertSql, [
        election.id,
        election.name,
        election.electionCode,
        election.electionType,
        election.electionDate,
        election.countingDate,
        safeStateId,
        safePcId,
        safeAcId,
        election.isActive,
        !hasDefault, // If tenant currently has no default election, pin this as default
        election.status,
        election.totalVotersSnapshot,
        election.targetVotes,
        election.description,
      ]);

      await client.query('COMMIT');
      logger.info(`[ElectionSync] Successfully synced election '${election.name}' (${election.id}) to tenant DB '${tenantDbName}'`);
    } catch (err: any) {
      await client.query('ROLLBACK');
      logger.error(`[ElectionSync] Failed to sync election '${election.id}' to tenant DB '${tenantDbName}':`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Safely unassigns / removes an election from a tenant database
   */
  static async removeElectionFromTenantDb(
    tenantDbName: string,
    electionId: string
  ): Promise<void> {
    if (!tenantDbName) return;
    const pool = getTenantDbPool(tenantDbName);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if any voter statuses are linked to this election in the tenant DB
      const checkSql = `
        SELECT COUNT(*) AS votes_count
        FROM voter_election_statuses
        WHERE election_id = $1 AND has_voted = true;
      `;
      const checkRes = await client.query(checkSql, [electionId]);
      const votesCount = parseInt(checkRes.rows[0]?.votes_count || '0', 10);

      if (votesCount > 0) {
        // Votes exist: soft archive to preserve election telemetry and turnout integrity
        await client.query(
          `UPDATE elections
           SET is_active = false, status = 'ARCHIVED', is_default = false, updated_at = NOW()
           WHERE id = $1;`,
          [electionId]
        );
        logger.info(`[ElectionSync] Election '${electionId}' in '${tenantDbName}' has ${votesCount} recorded votes; archived instead of hard-deleting.`);
      } else {
        // No votes cast: safely delete the unassigned election
        await client.query(`DELETE FROM elections WHERE id = $1;`, [electionId]);
        logger.info(`[ElectionSync] Cleanly removed unassigned election '${electionId}' from tenant DB '${tenantDbName}'.`);
      }

      // If the removed/archived election was default, promote the closest active election
      const activeCheck = await client.query(
        `SELECT id FROM elections WHERE is_default = true LIMIT 1;`
      );
      if (!activeCheck.rows.length) {
        await client.query(`
          UPDATE elections
          SET is_default = true
          WHERE id = (
            SELECT id FROM elections
            WHERE is_active = true AND status IN ('ACTIVE', 'UPCOMING')
            ORDER BY election_date ASC, created_at DESC
            LIMIT 1
          );
        `);
      }

      await client.query('COMMIT');
    } catch (err: any) {
      await client.query('ROLLBACK');
      logger.error(`[ElectionSync] Error removing election '${electionId}' from tenant DB '${tenantDbName}':`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Replicates an updated master election to all currently assigned tenant databases
   */
  static async syncElectionToAllAssignedTenants(electionId: string): Promise<void> {
    const election = await superAdminElectionQueries.getSuperAdminElectionById(electionId);
    if (!election) {
      logger.warn(`[ElectionSync] Cannot sync: election '${electionId}' not found.`);
      return;
    }

    const assignedTenants = await superAdminElectionQueries.getAssignedTenantsForElection(electionId);
    if (assignedTenants.length === 0) {
      logger.info(`[ElectionSync] Election '${electionId}' has no assigned tenants. Skipping DB sync.`);
      return;
    }

    logger.info(`[ElectionSync] Syncing election '${election.name}' across ${assignedTenants.length} assigned tenant databases...`);

    for (const tenant of assignedTenants) {
      try {
        await this.syncElectionToTenantDb(tenant.tenantDbName, election);
      } catch (err) {
        logger.error(`[ElectionSync] Failed to sync election to tenant '${tenant.name}' (${tenant.tenantDbName}):`, err);
        // Continue syncing other assigned tenants
      }
    }
  }

  /**
   * Syncs all assigned master elections for a given tenant into its database
   */
  static async syncAllAssignedElectionsForTenant(
    tenantId: string,
    tenantDbName: string
  ): Promise<void> {
    const assignedElections = await superAdminElectionQueries.getAssignedElectionsForTenant(tenantId);
    if (assignedElections.length === 0) {
      logger.info(`[ElectionSync] Tenant '${tenantId}' has no assigned elections.`);
      return;
    }

    logger.info(`[ElectionSync] Syncing ${assignedElections.length} assigned elections to tenant DB '${tenantDbName}'...`);
    for (const election of assignedElections) {
      try {
        await this.syncElectionToTenantDb(tenantDbName, election);
      } catch (err) {
        logger.error(`[ElectionSync] Error syncing election '${election.id}' to '${tenantDbName}':`, err);
      }
    }
  }
}
