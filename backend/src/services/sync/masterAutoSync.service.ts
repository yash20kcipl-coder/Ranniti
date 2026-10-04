import { Pool } from 'pg';
import { query as masterQuery } from '../../queries/dbPool';
import { logger } from '../../utils/logger';

export class MasterAutoSyncService {
  /**
   * Syncs a tenant-created/updated/deleted entity (ac, ward, booth, voter) to the Master database.
   * If immediate sync fails, queues the entity into tenant_sync_outbox in the Tenant DB.
   */
  static async syncEntityToMaster(
    tenantPool: Pool,
    entityType: 'ac' | 'ward' | 'booth' | 'voter',
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: Record<string, any>,
    isRetry = false
  ): Promise<boolean> {
    try {
      let sql = '';
      let params: any[] = [];

      if (action === 'DELETE') {
        if (entityType === 'ac') {
          sql = `DELETE FROM assembly_constituencies WHERE id = $1`;
        } else if (entityType === 'ward') {
          sql = `DELETE FROM wards WHERE id = $1`;
        } else if (entityType === 'booth') {
          sql = `DELETE FROM booths WHERE id = $1`;
        } else if (entityType === 'voter') {
          sql = `DELETE FROM voters WHERE id = $1`;
        }
        params = [entityId];
      } else if (entityType === 'ac') {
        sql = `
          INSERT INTO assembly_constituencies (id, ac_number, name, district_id, pc_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            ac_number = EXCLUDED.ac_number,
            name = EXCLUDED.name,
            district_id = COALESCE(EXCLUDED.district_id, assembly_constituencies.district_id),
            pc_id = COALESCE(EXCLUDED.pc_id, assembly_constituencies.pc_id),
            updated_at = NOW();
        `;
        params = [
          entityId || payload.id,
          payload.acNumber ?? payload.acNo ?? 1,
          payload.name || payload.acName || 'Unnamed AC',
          payload.districtId || null,
          payload.pcId || null,
        ];
      } else if (entityType === 'ward') {
        sql = `
          INSERT INTO wards (id, ward_number, name, ac_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            ward_number = EXCLUDED.ward_number,
            name = EXCLUDED.name,
            ac_id = COALESCE(EXCLUDED.ac_id, wards.ac_id),
            updated_at = NOW();
        `;
        params = [
          entityId || payload.id,
          payload.wardNumber ?? payload.wardNo ?? 1,
          payload.name || payload.wardName || 'Ward No. 1',
          payload.acId || null,
        ];
      } else if (entityType === 'booth') {
        sql = `
          INSERT INTO booths (id, booth_number, name, ac_id, ward_id, village_id, total_voters, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            booth_number = EXCLUDED.booth_number,
            name = EXCLUDED.name,
            ac_id = COALESCE(EXCLUDED.ac_id, booths.ac_id),
            ward_id = COALESCE(EXCLUDED.ward_id, booths.ward_id),
            village_id = COALESCE(EXCLUDED.village_id, booths.village_id),
            total_voters = COALESCE(EXCLUDED.total_voters, booths.total_voters),
            updated_at = NOW();
        `;
        params = [
          entityId || payload.id,
          payload.boothNumber ?? payload.boothNo ?? 1,
          payload.name || payload.boothName || 'Polling Station',
          payload.acId || null,
          payload.wardId || null,
          payload.villageId || null,
          payload.totalVoters ?? 0,
        ];
      } else if (entityType === 'voter') {
        sql = `
          INSERT INTO voters (
            id, epic_no, state_id, district_id, pc_id, ac_id, booth_id, serial_no, section_no, house_no,
            first_name, eng_first_name, middle_name, eng_middle_name, surname, eng_surname,
            gender, dob, age, mobile_no, email, aadhaar_no, pan_no,
            profession_type, profession, religion_id, caste_id, subcaste_name, voter_type,
            status, is_dead, blood_group, avatar, taluka, village, full_address, voter_address,
            party_id, family_id, is_family_influencer, is_social_influencer, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23,
            $24, $25, $26, $27, $28, $29,
            $30, $31, $32, $33, $34, $35, $36, $37,
            $38, $39, $40, $41, NOW(), NOW()
          )
          ON CONFLICT (epic_no) DO UPDATE SET
            state_id = COALESCE(EXCLUDED.state_id, voters.state_id),
            district_id = COALESCE(EXCLUDED.district_id, voters.district_id),
            pc_id = COALESCE(EXCLUDED.pc_id, voters.pc_id),
            ac_id = COALESCE(EXCLUDED.ac_id, voters.ac_id),
            booth_id = COALESCE(EXCLUDED.booth_id, voters.booth_id),
            serial_no = COALESCE(EXCLUDED.serial_no, voters.serial_no),
            section_no = COALESCE(EXCLUDED.section_no, voters.section_no),
            house_no = COALESCE(EXCLUDED.house_no, voters.house_no),
            first_name = COALESCE(EXCLUDED.first_name, voters.first_name),
            eng_first_name = COALESCE(EXCLUDED.eng_first_name, voters.eng_first_name),
            middle_name = COALESCE(EXCLUDED.middle_name, voters.middle_name),
            eng_middle_name = COALESCE(EXCLUDED.eng_middle_name, voters.eng_middle_name),
            surname = COALESCE(EXCLUDED.surname, voters.surname),
            eng_surname = COALESCE(EXCLUDED.eng_surname, voters.eng_surname),
            gender = COALESCE(EXCLUDED.gender, voters.gender),
            dob = COALESCE(EXCLUDED.dob, voters.dob),
            age = COALESCE(EXCLUDED.age, voters.age),
            mobile_no = COALESCE(EXCLUDED.mobile_no, voters.mobile_no),
            email = COALESCE(EXCLUDED.email, voters.email),
            aadhaar_no = COALESCE(EXCLUDED.aadhaar_no, voters.aadhaar_no),
            pan_no = COALESCE(EXCLUDED.pan_no, voters.pan_no),
            profession_type = COALESCE(EXCLUDED.profession_type, voters.profession_type),
            profession = COALESCE(EXCLUDED.profession, voters.profession),
            religion_id = COALESCE(EXCLUDED.religion_id, voters.religion_id),
            caste_id = COALESCE(EXCLUDED.caste_id, voters.caste_id),
            subcaste_name = COALESCE(EXCLUDED.subcaste_name, voters.subcaste_name),
            voter_type = COALESCE(EXCLUDED.voter_type, voters.voter_type),
            status = COALESCE(EXCLUDED.status, voters.status),
            is_dead = COALESCE(EXCLUDED.is_dead, voters.is_dead),
            blood_group = COALESCE(EXCLUDED.blood_group, voters.blood_group),
            avatar = COALESCE(EXCLUDED.avatar, voters.avatar),
            taluka = COALESCE(EXCLUDED.taluka, voters.taluka),
            village = COALESCE(EXCLUDED.village, voters.village),
            full_address = COALESCE(EXCLUDED.full_address, voters.full_address),
            voter_address = COALESCE(EXCLUDED.voter_address, voters.voter_address),
            party_id = COALESCE(EXCLUDED.party_id, voters.party_id),
            family_id = COALESCE(EXCLUDED.family_id, voters.family_id),
            is_family_influencer = COALESCE(EXCLUDED.is_family_influencer, voters.is_family_influencer),
            is_social_influencer = COALESCE(EXCLUDED.is_social_influencer, voters.is_social_influencer),
            updated_at = NOW();
        `;
        params = [
          entityId || payload.id,
          payload.epicNo,
          payload.stateId || null,
          payload.districtId || null,
          payload.pcId || null,
          payload.acId || null,
          payload.boothId || null,
          payload.serialNo || null,
          payload.sectionNo || null,
          payload.houseNo || null,
          payload.firstName || null,
          payload.engFirstName || null,
          payload.middleName || null,
          payload.engMiddleName || null,
          payload.surname || null,
          payload.engSurname || null,
          payload.gender || null,
          payload.dob || null,
          payload.age || null,
          payload.mobileNo || null,
          payload.email || null,
          payload.aadhaarNo || null,
          payload.panNo || null,
          payload.professionType || null,
          payload.profession || null,
          payload.religionId || null,
          payload.casteId || null,
          payload.subcasteName || null,
          payload.voterType || 'Voter',
          payload.status || 'ACTIVE',
          payload.isDead ?? false,
          payload.bloodGroup || null,
          payload.avatar || null,
          payload.taluka || null,
          payload.village || null,
          payload.fullAddress || null,
          payload.voterAddress || null,
          payload.partyId || null,
          payload.familyId || null,
          payload.isFamilyInfluencer ?? false,
          payload.isSocialInfluencer ?? false,
        ];
      }

      await masterQuery(sql, params);
      logger.info(`[MasterAutoSync] Successfully synced ${entityType} (${entityId}) [${action}] to Master DB`);
      return true;
    } catch (err: any) {
      logger.warn(`[MasterAutoSync] Sync failed for ${entityType} (${entityId}). Action: ${action}: ${err.message}`);
      if (!isRetry) {
        await this.enqueueOutbox(tenantPool, entityType, entityId, action, payload, err.message);
      }
      return false;
    }
  }

  /**
   * Syncs a batch of voter records from Tenant to Master DB using chunked multi-row UPSERTs.
   * If any chunk fails, queues failed voter rows into tenant_sync_outbox.
   */
  static async syncVotersBatchToMaster(
    tenantPool: Pool,
    votersList: Record<string, any>[],
    isRetry = false
  ): Promise<{ inserted: number; errors: number }> {
    if (!votersList || votersList.length === 0) return { inserted: 0, errors: 0 };

    let totalSynced = 0;
    let totalErrors = 0;
    const CHUNK_SIZE = 500;

    for (let offset = 0; offset < votersList.length; offset += CHUNK_SIZE) {
      const chunk = votersList.slice(offset, offset + CHUNK_SIZE);
      const valuesParams: any[] = [];
      const valueTuples: string[] = [];
      let pIdx = 1;

      for (const row of chunk) {
        const epicNo = (row.epicNo || row.epic_no || '').toString().trim();
        if (!epicNo) continue;

        valueTuples.push(`(
          $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++},
          $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++},
          $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++},
          $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}
        )`);

        valuesParams.push(
          row.id || null,
          epicNo,
          row.stateId || row.state_id || null,
          row.districtId || row.district_id || null,
          row.pcId || row.pc_id || null,
          row.acId || row.ac_id || null,
          row.boothId || row.booth_id || null,
          row.serialNo || row.serial_no || null,
          row.sectionNo || row.section_no || null,
          row.houseNo || row.house_no || null,
          row.firstName || row.first_name || null,
          row.engFirstName || row.eng_first_name || null,
          row.middleName || row.middle_name || null,
          row.engMiddleName || row.eng_middle_name || null,
          row.surname || row.surname || null,
          row.engSurname || row.eng_surname || null,
          row.gender || null,
          row.dob || null,
          row.age || null,
          row.mobileNo || row.mobile_no || null,
          row.email || null,
          row.aadhaarNo || row.aadhaar_no || null,
          row.panNo || row.pan_no || null,
          row.professionType || row.profession_type || null,
          row.profession || null,
          row.religionId || row.religion_id || null,
          row.casteId || row.caste_id || null,
          row.subcasteName || row.subcaste_name || null,
          row.voterType || row.voter_type || 'Voter',
          row.status || 'Active',
          row.isDead ?? row.is_dead ?? false,
          row.bloodGroup || row.blood_group || null,
          row.taluka || null,
          row.village || null,
          row.fullAddress || row.full_address || null,
          row.voterAddress || row.voter_address || null,
          row.partyId || row.party_id || null,
          row.isFamilyInfluencer ?? row.is_family_influencer ?? false,
          row.isSocialInfluencer ?? row.is_social_influencer ?? false
        );
      }

      if (valueTuples.length === 0) continue;

      const sql = `
        INSERT INTO voters (
          id, epic_no, state_id, district_id, pc_id, ac_id, booth_id, serial_no, section_no, house_no,
          first_name, eng_first_name, middle_name, eng_middle_name, surname, eng_surname,
          gender, dob, age, mobile_no, email, aadhaar_no, pan_no,
          profession_type, profession, religion_id, caste_id, subcaste_name, voter_type,
          status, is_dead, blood_group, taluka, village, full_address, voter_address,
          party_id, is_family_influencer, is_social_influencer, created_at, updated_at
        ) VALUES ${valueTuples.join(', ')}
        ON CONFLICT (epic_no) DO UPDATE SET
          mobile_no = COALESCE(EXCLUDED.mobile_no, voters.mobile_no),
          email = COALESCE(EXCLUDED.email, voters.email),
          aadhaar_no = COALESCE(EXCLUDED.aadhaar_no, voters.aadhaar_no),
          pan_no = COALESCE(EXCLUDED.pan_no, voters.pan_no),
          profession_type = COALESCE(EXCLUDED.profession_type, voters.profession_type),
          profession = COALESCE(EXCLUDED.profession, voters.profession),
          religion_id = COALESCE(EXCLUDED.religion_id, voters.religion_id),
          caste_id = COALESCE(EXCLUDED.caste_id, voters.caste_id),
          subcaste_name = COALESCE(EXCLUDED.subcaste_name, voters.subcaste_name),
          voter_type = COALESCE(EXCLUDED.voter_type, voters.voter_type),
          status = COALESCE(EXCLUDED.status, voters.status),
          is_dead = COALESCE(EXCLUDED.is_dead, voters.is_dead),
          blood_group = COALESCE(EXCLUDED.blood_group, voters.blood_group),
          party_id = COALESCE(EXCLUDED.party_id, voters.party_id),
          is_family_influencer = COALESCE(EXCLUDED.is_family_influencer, voters.is_family_influencer),
          is_social_influencer = COALESCE(EXCLUDED.is_social_influencer, voters.is_social_influencer),
          updated_at = NOW()
      `;

      try {
        await masterQuery(sql, valuesParams);
        totalSynced += chunk.length;
      } catch (err: any) {
        logger.error(`[MasterAutoSync] Bulk voter chunk sync failed: ${err.message}`);
        totalErrors += chunk.length;
        if (!isRetry) {
          for (const v of chunk) {
            await this.enqueueOutbox(tenantPool, 'voter', v.id || v.epicNo, 'UPDATE', v, err.message);
          }
        }
      }
    }

    return { inserted: totalSynced, errors: totalErrors };
  }

  /**
   * Helper to insert a failed sync operation into tenant_sync_outbox
   */
  private static async enqueueOutbox(
    tenantPool: Pool,
    entityType: string,
    entityId: string,
    action: string,
    payload: Record<string, any>,
    errorMessage: string
  ): Promise<void> {
    try {
      const outboxSql = `
        INSERT INTO tenant_sync_outbox (entity_type, entity_id, action, payload, status, error_message, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'pending', $5, NOW(), NOW());
      `;
      await tenantPool.query(outboxSql, [
        entityType,
        entityId,
        action,
        JSON.stringify(payload),
        errorMessage,
      ]);
    } catch (e: any) {
      logger.error(`[MasterAutoSync] Failed to enqueue into tenant_sync_outbox:`, e);
    }
  }
}

