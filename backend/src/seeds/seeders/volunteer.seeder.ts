/**
 * Volunteer Seeder
 * Seeds a realistic hierarchical volunteer structure for every provisioned tenant:
 *
 *   1 × PC Leader
 *   2 × AC Leaders  (report to PC Leader)
 *   4 × Sub-Leaders (2 per AC Leader)
 *   6 × Supporters  (with booth assignments)
 *
 * Volunteers are stored in the MASTER admin_users table with tenant_db_name set.
 * Geographic data (PCs/ACs/Booths) is read from each tenant's own DB.
 *
 * Run standalone: npm run seed:volunteers
 */

import { logger } from '../../utils/logger';
import { query as masterQuery, closeDbPool } from '../../queries/dbPool';
import { TenantPoolManager } from '../../utils/tenantPoolManager';
import { generateVolunteerDefaultPassword } from '../../utils/volunteerPassword';
import { hashPassword } from '../../utils/password';

// ─── Helper ──────────────────────────────────────────────────────────────────

async function upsertVolunteer(payload: {
  name: string;
  email: string;
  mobile: string;
  role: 'pc_leader' | 'ac_leader' | 'sub_leader' | 'supporter';
  roleName: string;
  tenantDbName: string;
  parentLeaderId: string | null;
  assignedAcId: string | null;
  boothIds: string[];
}): Promise<string> {
  const password = generateVolunteerDefaultPassword(payload.name, payload.mobile);
  const passwordHash = await hashPassword(password);

  // Upsert volunteer in tenant_users table in Tenant DB
  const res = await TenantPoolManager.query(
    payload.tenantDbName,
    `INSERT INTO tenant_users
       (name, email, mobile, password_hash, role, role_name,
        tenant_db_name, parent_leader_id, assigned_ac_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
     ON CONFLICT (email) DO UPDATE
       SET name            = EXCLUDED.name,
           mobile          = EXCLUDED.mobile,
           role            = EXCLUDED.role,
           role_name       = EXCLUDED.role_name,
           tenant_db_name  = EXCLUDED.tenant_db_name,
           parent_leader_id = EXCLUDED.parent_leader_id,
           assigned_ac_id  = EXCLUDED.assigned_ac_id,
           status          = 'active',
           updated_at      = NOW()
     RETURNING id`,
    [
      payload.name,
      payload.email.toLowerCase(),
      payload.mobile,
      passwordHash,
      payload.role,
      payload.roleName,
      payload.tenantDbName,
      payload.parentLeaderId,
      payload.assignedAcId,
    ]
  );

  const userId: string = res.rows[0].id;

  // Sync booth assignments in tenant user_booth_assignments
  await TenantPoolManager.query(payload.tenantDbName, `DELETE FROM user_booth_assignments WHERE user_id = $1`, [userId]);
  if (payload.boothIds.length > 0) {
    for (const boothId of payload.boothIds) {
      await TenantPoolManager.query(
        payload.tenantDbName,
        `INSERT INTO user_booth_assignments (user_id, booth_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, boothId]
      );
    }
  }

  logger.info(
    `  ✔ ${payload.role.toUpperCase().padEnd(12)} | ${payload.name.padEnd(26)} | pwd: ${password}`
  );

  return userId;
}

// ─── Main Seeder ─────────────────────────────────────────────────────────────

export const seedVolunteers = async (): Promise<void> => {
  logger.info('');
  logger.info('==========================================');
  logger.info('👥 Seeding Volunteer Hierarchy for Tenants');
  logger.info('==========================================');

  // Get all active tenants from master DB
  const tenantsRes = await masterQuery(
    `SELECT name AS tenant_name, tenant_db_name
     FROM tenants
     WHERE status = 'active'
       AND tenant_db_name IS NOT NULL
     ORDER BY name`
  );

  if (!tenantsRes.rows.length) {
    logger.warn('No active tenants found. Run the main seeder first.');
    return;
  }

  for (const tenant of tenantsRes.rows) {
    const { tenant_db_name: dbName, tenant_name: tenantName } = tenant;
    logger.info('');
    logger.info(`🏢 Tenant: ${tenantName} (${dbName})`);

    try {
      const tenantPool = TenantPoolManager.getPool(dbName);

      // ── Fetch PCs & ACs from the tenant's own DB ─────────────────────────
      const acsRes = await tenantPool.query(
        `SELECT ac.id   AS ac_id,
                ac.name AS ac_name,
                pc.id   AS pc_id,
                pc.name AS pc_name
         FROM assembly_constituencies ac
         JOIN parliamentary_constituencies pc ON pc.id = ac.pc_id
         ORDER BY pc.name, ac.name
         LIMIT 6`
      );

      if (!acsRes.rows.length) {
        logger.warn(`  ⚠ No ACs found in ${dbName} — skipping.`);
        continue;
      }

      const allAcs = acsRes.rows;
      const firstPcId  = allAcs[0].pc_id;
      const firstPcName = allAcs[0].pc_name;
      const pcsAcs = allAcs.filter((a: any) => a.pc_id === firstPcId);

      const ac1 = pcsAcs[0];
      const ac2 = pcsAcs[1] ?? pcsAcs[0]; // fallback when only 1 AC

      // Fetch booth IDs for AC1 and AC2 from tenant DB
      const booths1Res = await tenantPool.query(
        `SELECT id FROM booths WHERE ac_id = $1 ORDER BY booth_number LIMIT 4`,
        [ac1.ac_id]
      );
      const booths2Res = await tenantPool.query(
        `SELECT id FROM booths WHERE ac_id = $1 ORDER BY booth_number LIMIT 4`,
        [ac2.ac_id]
      );
      const booths1: string[] = booths1Res.rows.map((r: any) => r.id);
      const booths2: string[] = booths2Res.rows.map((r: any) => r.id);
      const allPcBooths: string[] = [...booths1, ...booths2];

      // Derive a short, unique suffix from the DB name for emails & mobiles
      const shortDb = dbName.replace('ranniti_tenant_', '').replace(/_/g, '');
      const mobileBase = shortDb.replace(/\D/g, '').slice(-6).padStart(6, '0');

      // ── 1. PC LEADER (Assigned ALL booths in the PC) ──────────────────────
      logger.info(`  ── PC: ${firstPcName}`);
      const pcLeaderId = await upsertVolunteer({
        name:           `Suresh ${firstPcName}`,
        email:          `pc.leader.${shortDb}@ranniti.field`,
        mobile:         `91${mobileBase}01`,
        role:           'pc_leader',
        roleName:       `${firstPcName} PC Leader`,
        tenantDbName:   dbName,
        parentLeaderId: null,
        assignedAcId:   null,
        boothIds:       allPcBooths,
      });

      // ── 2. AC LEADERS (Assigned ALL booths in their respective AC) ────────
      logger.info(`  ── AC 1: ${ac1.ac_name}`);
      const acLeader1Id = await upsertVolunteer({
        name:           `Rajesh ${ac1.ac_name.replace(/\s+/g, '')}`,
        email:          `ac1.leader.${shortDb}@ranniti.field`,
        mobile:         `91${mobileBase}02`,
        role:           'ac_leader',
        roleName:       `${ac1.ac_name} Assembly Leader`,
        tenantDbName:   dbName,
        parentLeaderId: pcLeaderId,
        assignedAcId:   ac1.ac_id,
        boothIds:       booths1,
      });

      logger.info(`  ── AC 2: ${ac2.ac_name}`);
      const acLeader2Id = await upsertVolunteer({
        name:           `Priya ${ac2.ac_name.replace(/\s+/g, '')}`,
        email:          `ac2.leader.${shortDb}@ranniti.field`,
        mobile:         `91${mobileBase}03`,
        role:           'ac_leader',
        roleName:       `${ac2.ac_name} Assembly Leader`,
        tenantDbName:   dbName,
        parentLeaderId: pcLeaderId,
        assignedAcId:   ac2.ac_id,
        boothIds:       booths2,
      });

      // ── 3. SUB-LEADERS (Assigned specific booths within their AC) ─────────
      const subLeader1Id = await upsertVolunteer({
        name:           `Anil WardA ${ac1.ac_name.replace(/\s+/g, '')}`,
        email:          `sub1.leader.${shortDb}@ranniti.field`,
        mobile:         `91${mobileBase}04`,
        role:           'sub_leader',
        roleName:       `${ac1.ac_name} Ward-A Coordinator`,
        tenantDbName:   dbName,
        parentLeaderId: acLeader1Id,
        assignedAcId:   ac1.ac_id,
        boothIds:       booths1.slice(0, 1),  // booth 1
      });

      const subLeader2Id = await upsertVolunteer({
        name:           `Balu WardB ${ac1.ac_name.replace(/\s+/g, '')}`,
        email:          `sub2.leader.${shortDb}@ranniti.field`,
        mobile:         `91${mobileBase}05`,
        role:           'sub_leader',
        roleName:       `${ac1.ac_name} Ward-B Coordinator`,
        tenantDbName:   dbName,
        parentLeaderId: acLeader1Id,
        assignedAcId:   ac1.ac_id,
        boothIds:       booths1.slice(1, 2),  // booth 2
      });

      const subLeader3Id = await upsertVolunteer({
        name:           `Kiran WardC ${ac2.ac_name.replace(/\s+/g, '')}`,
        email:          `sub3.leader.${shortDb}@ranniti.field`,
        mobile:         `91${mobileBase}06`,
        role:           'sub_leader',
        roleName:       `${ac2.ac_name} Ward-C Coordinator`,
        tenantDbName:   dbName,
        parentLeaderId: acLeader2Id,
        assignedAcId:   ac2.ac_id,
        boothIds:       booths2.slice(0, 1),  // booth 1
      });

      const subLeader4Id = await upsertVolunteer({
        name:           `Deepa WardD ${ac2.ac_name.replace(/\s+/g, '')}`,
        email:          `sub4.leader.${shortDb}@ranniti.field`,
        mobile:         `91${mobileBase}07`,
        role:           'sub_leader',
        roleName:       `${ac2.ac_name} Ward-D Coordinator`,
        tenantDbName:   dbName,
        parentLeaderId: acLeader2Id,
        assignedAcId:   ac2.ac_id,
        boothIds:       booths2.slice(1, 2),  // booth 2
      });

      // ── 4. SUPPORTERS (1 booth matching their parent sub-leader) ──────────
      await upsertVolunteer({
        name:           `Ramesh Voter AC1`,
        email:          `supporter1.${shortDb}@ranniti.field`,
        mobile:         `91${mobileBase}08`,
        role:           'supporter',
        roleName:       'Booth Campaign Supporter',
        tenantDbName:   dbName,
        parentLeaderId: subLeader1Id,
        assignedAcId:   ac1.ac_id,
        boothIds:       booths1.slice(0, 1),  // booth 1 under SubLeader1
      });

      await upsertVolunteer({
        name:           `Kavita Ground AC1`,
        email:          `supporter2.${shortDb}@ranniti.field`,
        mobile:         `91${mobileBase}09`,
        role:           'supporter',
        roleName:       'Booth Campaign Supporter',
        tenantDbName:   dbName,
        parentLeaderId: subLeader2Id,
        assignedAcId:   ac1.ac_id,
        boothIds:       booths1.slice(1, 2),  // booth 2 under SubLeader2
      });

      await upsertVolunteer({
        name:           `Manoj Field AC1`,
        email:          `supporter3.${shortDb}@ranniti.field`,
        mobile:         `91${mobileBase}10`,
        role:           'supporter',
        roleName:       'Booth Campaign Supporter',
        tenantDbName:   dbName,
        parentLeaderId: subLeader1Id,
        assignedAcId:   ac1.ac_id,
        boothIds:       booths1.slice(0, 1),  // booth 1 under SubLeader1
      });

      await upsertVolunteer({
        name:           `Sunita Booth AC2`,
        email:          `supporter4.${shortDb}@ranniti.field`,
        mobile:         `91${mobileBase}11`,
        role:           'supporter',
        roleName:       'Booth Campaign Supporter',
        tenantDbName:   dbName,
        parentLeaderId: subLeader3Id,
        assignedAcId:   ac2.ac_id,
        boothIds:       booths2.slice(0, 1),  // booth 1 under SubLeader3
      });

      await upsertVolunteer({
        name:           `Raju Campaign AC2`,
        email:          `supporter5.${shortDb}@ranniti.field`,
        mobile:         `91${mobileBase}12`,
        role:           'supporter',
        roleName:       'Booth Campaign Supporter',
        tenantDbName:   dbName,
        parentLeaderId: subLeader4Id,
        assignedAcId:   ac2.ac_id,
        boothIds:       booths2.slice(1, 2),  // booth 2 under SubLeader4
      });

      await upsertVolunteer({
        name:           `Anita Voter AC2`,
        email:          `supporter6.${shortDb}@ranniti.field`,
        mobile:         `91${mobileBase}13`,
        role:           'supporter',
        roleName:       'Booth Campaign Supporter',
        tenantDbName:   dbName,
        parentLeaderId: subLeader4Id,
        assignedAcId:   ac2.ac_id,
        boothIds:       booths2.slice(1, 2),  // booth 2 under SubLeader4
      });

      logger.info(`  ✅ Seeded 13 volunteers for ${tenantName} (1 PC + 2 AC + 4 Sub + 6 Supporters)`);
    } catch (err: any) {
      logger.error(`  ❌ Failed for ${dbName}: ${err.message}`);
    }
  }

  logger.info('');
  logger.info('==========================================');
  logger.info('✅ Volunteer Seeding Complete');
  logger.info('==========================================');
};

// ─── CLI Entry Point ─────────────────────────────────────────────────────────
if (require.main === module) {
  seedVolunteers()
    .then(() => TenantPoolManager.closeAllPools())
    .then(() => closeDbPool())
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Volunteer seed failed:', err);
      process.exit(1);
    });
}
