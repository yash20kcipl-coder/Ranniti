/**
 * Volunteer Seeder
 * Seeds a realistic hierarchical volunteer structure into every provisioned tenant DB:
 *   1 × PC Leader
 *   2 × AC Leaders  (report to PC Leader)
 *   4 × Sub-Leaders (report to AC Leaders, 2 per AC)
 *   6 × Supporters  (report to Sub-Leaders, with booth assignments)
 *
 * Run via: npm run seed:volunteers
 */

import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantPoolManager } from '../../utils/tenantPoolManager';
import { generateVolunteerDefaultPassword } from '../../utils/volunteerPassword';
import { hashPassword } from '../../utils/password';

// ─── Helper ──────────────────────────────────────────────────────────────────

async function upsertVolunteer(
  pool: Pool,
  payload: {
    id?: string;
    name: string;
    email: string;
    mobile: string;
    role: 'pc_leader' | 'ac_leader' | 'sub_leader' | 'supporter';
    roleName: string;
    parentLeaderId: string | null;
    assignedAcId: string | null;
    boothIds: string[];
  }
): Promise<string> {
  const password = generateVolunteerDefaultPassword(payload.name, payload.mobile);
  const passwordHash = await hashPassword(password);

  // Upsert on email
  const res = await pool.query(
    `INSERT INTO admin_users
       (name, email, mobile, password_hash, role, role_name, parent_leader_id, assigned_ac_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name,
           mobile = EXCLUDED.mobile,
           role = EXCLUDED.role,
           role_name = EXCLUDED.role_name,
           parent_leader_id = EXCLUDED.parent_leader_id,
           assigned_ac_id = EXCLUDED.assigned_ac_id,
           status = 'active',
           updated_at = NOW()
     RETURNING id`,
    [
      payload.name,
      payload.email.toLowerCase(),
      payload.mobile,
      passwordHash,
      payload.role,
      payload.roleName,
      payload.parentLeaderId,
      payload.assignedAcId,
    ]
  );

  const userId: string = res.rows[0].id;

  // Assign booths
  if (payload.boothIds.length > 0) {
    await pool.query(`DELETE FROM user_booth_assignments WHERE user_id = $1`, [userId]);
    for (const boothId of payload.boothIds) {
      await pool.query(
        `INSERT INTO user_booth_assignments (user_id, booth_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, boothId]
      );
    }
  }

  logger.info(
    `  ✔ ${payload.role.toUpperCase().padEnd(12)} | ${payload.name.padEnd(22)} | mobile: ${payload.mobile} | pwd: ${password}`
  );

  return userId;
}

// ─── Main Seeder ─────────────────────────────────────────────────────────────

export const seedVolunteers = async (): Promise<void> => {
  logger.info('');
  logger.info('==========================================');
  logger.info('👥 Seeding Volunteer Hierarchy for Tenants');
  logger.info('==========================================');

  // Get all active tenant DBs
  const tenantsRes = await masterQuery(
    `SELECT u.id, u.name, ta.tenant_db_name
     FROM admin_users u
     JOIN tenant_assignments ta ON ta.user_id = u.id
     WHERE u.role = 'tenant_admin' AND ta.status = 'active' AND ta.tenant_db_name IS NOT NULL
     ORDER BY u.name`
  );

  if (!tenantsRes.rows.length) {
    logger.warn('No active tenants found. Run the main seeder first.');
    return;
  }

  for (const tenant of tenantsRes.rows) {
    const { tenant_db_name: dbName, name: tenantName } = tenant;
    logger.info('');
    logger.info(`🏢 Tenant: ${tenantName} (${dbName})`);

    let pool: Pool | null = null;
    try {
      pool = TenantPoolManager.getPool(dbName);

      // ── Fetch PCs & ACs available in this tenant DB ──────────────────────
      const acsRes = await pool.query(
        `SELECT ac.id, ac.name, ac.pc_id,
                pc.name AS pc_name
         FROM assembly_constituencies ac
         JOIN parliamentary_constituencies pc ON pc.id = ac.pc_id
         ORDER BY pc.name, ac.name
         LIMIT 6`
      );

      if (!acsRes.rows.length) {
        logger.warn(`  ⚠ No ACs in ${dbName} — skipping.`);
        continue;
      }

      const allAcs = acsRes.rows;
      const firstPcId = allAcs[0].pc_id;
      const firstPcName = allAcs[0].pc_name;

      // ACs for this PC (max 6)
      const pcsAcs = allAcs.filter((a: any) => a.pc_id === firstPcId);
      const ac1 = pcsAcs[0];
      const ac2 = pcsAcs[1] ?? pcsAcs[0]; // fallback if only 1 AC

      // Fetch booths for AC1 and AC2
      const booths1Res = await pool.query(
        `SELECT id FROM booths WHERE ac_id = $1 ORDER BY booth_number LIMIT 4`,
        [ac1.id]
      );
      const booths2Res = await pool.query(
        `SELECT id FROM booths WHERE ac_id = $1 ORDER BY booth_number LIMIT 4`,
        [ac2.id]
      );
      const booths1 = booths1Res.rows.map((r: any) => r.id);
      const booths2 = booths2Res.rows.map((r: any) => r.id);

      const shortDb = dbName.replace('ranniti_tenant_', '').replace(/_/g, '');

      // ── 1. PC LEADER ─────────────────────────────────────────────────────
      logger.info(`  ── PC: ${firstPcName}`);
      const pcLeaderId = await upsertVolunteer(pool, {
        name:          `Suresh ${firstPcName}`,
        email:         `pc.leader.${shortDb}@ranniti.field`,
        mobile:        `91${shortDb.slice(-8).padStart(8, '1')}01`,
        role:          'pc_leader',
        roleName:      `${firstPcName} PC Parliamentary Leader`,
        parentLeaderId: null,
        assignedAcId:   null,
        boothIds:       [],
      });

      // ── 2. AC LEADERS ────────────────────────────────────────────────────
      logger.info(`  ── AC 1: ${ac1.name}`);
      const acLeader1Id = await upsertVolunteer(pool, {
        name:          `Rajesh ${ac1.name.replace(/\s+/g, '')}`,
        email:         `ac1.leader.${shortDb}@ranniti.field`,
        mobile:        `91${shortDb.slice(-8).padStart(8, '2')}02`,
        role:          'ac_leader',
        roleName:      `${ac1.name} Assembly Leader`,
        parentLeaderId: pcLeaderId,
        assignedAcId:   ac1.id,
        boothIds:       [],
      });

      logger.info(`  ── AC 2: ${ac2.name}`);
      const acLeader2Id = await upsertVolunteer(pool, {
        name:          `Priya ${ac2.name.replace(/\s+/g, '')}`,
        email:         `ac2.leader.${shortDb}@ranniti.field`,
        mobile:        `91${shortDb.slice(-8).padStart(8, '3')}03`,
        role:          'ac_leader',
        roleName:      `${ac2.name} Assembly Leader`,
        parentLeaderId: pcLeaderId,
        assignedAcId:   ac2.id,
        boothIds:       [],
      });

      // ── 3. SUB-LEADERS (2 per AC) ────────────────────────────────────────
      const subLeader1Id = await upsertVolunteer(pool, {
        name:          `Anil WardA ${ac1.name.replace(/\s+/g, '')}`,
        email:         `sub1.leader.${shortDb}@ranniti.field`,
        mobile:        `91${shortDb.slice(-8).padStart(8, '4')}04`,
        role:          'sub_leader',
        roleName:      `${ac1.name} Ward-A Coordinator`,
        parentLeaderId: acLeader1Id,
        assignedAcId:   ac1.id,
        boothIds:       booths1.slice(0, 2),
      });

      const subLeader2Id = await upsertVolunteer(pool, {
        name:          `Balu WardB ${ac1.name.replace(/\s+/g, '')}`,
        email:         `sub2.leader.${shortDb}@ranniti.field`,
        mobile:        `91${shortDb.slice(-8).padStart(8, '5')}05`,
        role:          'sub_leader',
        roleName:      `${ac1.name} Ward-B Coordinator`,
        parentLeaderId: acLeader1Id,
        assignedAcId:   ac1.id,
        boothIds:       booths1.slice(2, 4),
      });

      const subLeader3Id = await upsertVolunteer(pool, {
        name:          `Kiran WardC ${ac2.name.replace(/\s+/g, '')}`,
        email:         `sub3.leader.${shortDb}@ranniti.field`,
        mobile:        `91${shortDb.slice(-8).padStart(8, '6')}06`,
        role:          'sub_leader',
        roleName:      `${ac2.name} Ward-C Coordinator`,
        parentLeaderId: acLeader2Id,
        assignedAcId:   ac2.id,
        boothIds:       booths2.slice(0, 2),
      });

      const subLeader4Id = await upsertVolunteer(pool, {
        name:          `Deepa WardD ${ac2.name.replace(/\s+/g, '')}`,
        email:         `sub4.leader.${shortDb}@ranniti.field`,
        mobile:        `91${shortDb.slice(-8).padStart(8, '7')}07`,
        role:          'sub_leader',
        roleName:      `${ac2.name} Ward-D Coordinator`,
        parentLeaderId: acLeader2Id,
        assignedAcId:   ac2.id,
        boothIds:       booths2.slice(2, 4),
      });

      // ── 4. SUPPORTERS (1-2 per Sub-Leader, with booth assignments) ───────
      await upsertVolunteer(pool, {
        name:          `Ramesh Voter AC1`,
        email:         `supporter1.${shortDb}@ranniti.field`,
        mobile:        `91${shortDb.slice(-8).padStart(8, '8')}08`,
        role:          'supporter',
        roleName:      'Booth Campaign Supporter',
        parentLeaderId: subLeader1Id,
        assignedAcId:   ac1.id,
        boothIds:       booths1.slice(0, 1),
      });

      await upsertVolunteer(pool, {
        name:          `Kavita Ground AC1`,
        email:         `supporter2.${shortDb}@ranniti.field`,
        mobile:        `91${shortDb.slice(-8).padStart(8, '9')}09`,
        role:          'supporter',
        roleName:      'Booth Campaign Supporter',
        parentLeaderId: subLeader1Id,
        assignedAcId:   ac1.id,
        boothIds:       booths1.slice(1, 2),
      });

      await upsertVolunteer(pool, {
        name:          `Manoj Field AC1`,
        email:         `supporter3.${shortDb}@ranniti.field`,
        mobile:        `91${shortDb.slice(-8).padStart(8, '1')}10`,
        role:          'supporter',
        roleName:      'Booth Campaign Supporter',
        parentLeaderId: subLeader2Id,
        assignedAcId:   ac1.id,
        boothIds:       booths1.slice(2, 3),
      });

      await upsertVolunteer(pool, {
        name:          `Sunita Booth AC2`,
        email:         `supporter4.${shortDb}@ranniti.field`,
        mobile:        `91${shortDb.slice(-8).padStart(8, '2')}11`,
        role:          'supporter',
        roleName:      'Booth Campaign Supporter',
        parentLeaderId: subLeader3Id,
        assignedAcId:   ac2.id,
        boothIds:       booths2.slice(0, 1),
      });

      await upsertVolunteer(pool, {
        name:          `Raju Campaign AC2`,
        email:         `supporter5.${shortDb}@ranniti.field`,
        mobile:        `91${shortDb.slice(-8).padStart(8, '3')}12`,
        role:          'supporter',
        roleName:      'Booth Campaign Supporter',
        parentLeaderId: subLeader3Id,
        assignedAcId:   ac2.id,
        boothIds:       booths2.slice(1, 2),
      });

      await upsertVolunteer(pool, {
        name:          `Anita Voter AC2`,
        email:         `supporter6.${shortDb}@ranniti.field`,
        mobile:        `91${shortDb.slice(-8).padStart(8, '4')}13`,
        role:          'supporter',
        roleName:      'Booth Campaign Supporter',
        parentLeaderId: subLeader4Id,
        assignedAcId:   ac2.id,
        boothIds:       booths2.slice(2, 3),
      });

      logger.info(`  ✅ Seeded 13 volunteers for ${tenantName} (1 PC + 2 AC + 4 Sub + 6 Supporters)`);
    } catch (err: any) {
      logger.error(`  ❌ Failed to seed volunteers for ${dbName}: ${err.message}`);
    }
  }

  logger.info('');
  logger.info('==========================================');
  logger.info('✅ Volunteer Seeding Complete');
  logger.info('==========================================');
};

// ─── CLI Entry Point ─────────────────────────────────────────────────────────
const runDirectly = require.main === module;
if (runDirectly) {
  const { closeDbPool } = require('../../queries/dbPool');
  seedVolunteers()
    .then(() => TenantPoolManager.closeAllPools())
    .then(() => closeDbPool())
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Volunteer seed failed:', err);
      process.exit(1);
    });
}
