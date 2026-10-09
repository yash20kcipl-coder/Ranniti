import { logger } from '../../utils/logger';
import { query } from '../../queries/dbPool';
import { BulkImporter } from '../../utils/bulkImporter';
import { VoterQueries } from '../../queries/voter.queries';
import { CacheService } from '../../services/cache.service';
import { LookupResolverService } from '../lookupResolver.service';
import { calculateAge, formatDateForDb } from '../../utils/dateUtils';
import { FamilyMappingService } from '../../services/tenant/familyMapping.service';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';

export class VoterImportService {
  static async import(
    records: Record<string, any>[],
    progressCallback?: BulkImportProgressCallback,
    context?: BulkImportContext
  ): Promise<BulkImportServiceResult> {
    // 1. Ultra-fast parallel resolution & auto-provisioning for all master entities
    const masters = await LookupResolverService.resolveVoterMasters(records, context);

    const parseBool = (val: any): boolean => {
      if (val === true || val === 1) return true;
      if (typeof val === 'string') {
        const lower = val.trim().toLowerCase();
        return lower === 'yes' || lower === 'true' || lower === '1' || lower === 'y';
      }
      return false;
    };

    // Keep track of all affected booth IDs throughout import
    const allAffectedBoothIds = new Set<string>();

    const result = await BulkImporter.processArray(records, {
      batchSize: 500,
      concurrency: 2,
      onProgress: progressCallback,
      onBatchInsert: async (batch) => {
        const votersToInsert: any[] = [];
        const batchErrors: any[] = [];
        let batchFailed = 0;

        for (let idx = 0; idx < batch.length; idx++) {
          const row = batch[idx];
          const epicNo = LookupResolverService.extractValue(row, [
            'EPIC No',
            'EPIC_NO',
            'IdCardNo',
            'Id Card No',
            'epicNo',
            'epic_no',
          ]);

          if (!epicNo) {
            batchFailed++;
            batchErrors.push({
              index: row.__rowIndex ?? (idx + 1),
              row,
              error: 'Missing required EPIC / Voter ID number',
            });
            continue;
          }

          // 1. Resolve AC
          const acRef = LookupResolverService.extractValue(row, [
            'AC Name',
            'acName',
            'acId',
            'ac_id',
            'AC ID',
            'AC_ID',
            'AC Number',
            'acNumber',
            'ac_number',
          ]);
          let acId: string | undefined = undefined;
          if (acRef) {
            acId = masters.acs.get(acRef.toLowerCase()) || masters.acs.get(acRef);
          }
          if (!acId && context?.acId) {
            acId = context.acId;
          }

          // 2. Resolve Booth (Pre-provisioned in masters.booths)
          const boothRef = LookupResolverService.extractValue(row, [
            'Select Booth',
            'Booth Name',
            'boothName',
            'boothId',
            'booth_id',
            'Booth ID',
            'Booth_ID',
          ]);
          const boothNumRef = LookupResolverService.extractValue(row, [
            'Booth No',
            'Booth Number',
            'boothNumber',
            'boothNo',
            'booth_number',
          ]);

          let boothId: string | undefined = undefined;
          let resolvedBooth: any = undefined;

          if (acId && boothNumRef) {
            resolvedBooth = masters.booths.get(`${acId}_${boothNumRef}`);
          }
          if (!resolvedBooth && boothRef) {
            resolvedBooth = (acId ? masters.booths.get(`${acId}_${boothRef.toLowerCase()}`) : undefined) || masters.booths.get(boothRef.toLowerCase());
          }
          if (!resolvedBooth && boothNumRef) {
            resolvedBooth = masters.booths.get(boothNumRef);
          }

          if (resolvedBooth) {
            boothId = resolvedBooth.id;
            if (boothId) {
              allAffectedBoothIds.add(boothId);
            }
            if (!acId && resolvedBooth.ac_id) {
              acId = resolvedBooth.ac_id;
            }
          }

          // 3. Resolve PC, District, State with O(1) lookups
          const pcRef = LookupResolverService.extractValue(row, [
            'PC Name',
            'pcName',
            'pcId',
            'pc_id',
            'pId',
            'p_id',
            'PC ID',
            'PC_ID',
            'PC Number',
            'pcNumber',
            'pc_number',
            'PC No',
          ]);
          let pcId: string | undefined = undefined;
          if (pcRef) {
            pcId = masters.pcs.get(pcRef.toLowerCase()) || masters.pcs.get(pcRef);
          }
          if (!pcId && context?.pcId) {
            pcId = context.pcId;
          }

          const distRef = LookupResolverService.extractValue(row, [
            'District Name',
            'districtName',
            'districtId',
            'district_id',
            'District ID',
            'District_ID',
          ]);
          let districtId: string | undefined = undefined;
          if (distRef) {
            districtId = masters.districts.get(distRef.toLowerCase()) || masters.districts.get(distRef);
          }
          if (!districtId && context?.districtId) {
            districtId = context.districtId;
          }

          const stateRef = LookupResolverService.extractValue(row, [
            'State Name',
            'stateName',
            'stateId',
            'state_id',
            'State ID',
            'State_ID',
          ]);
          let stateId: string | undefined = undefined;
          if (stateRef) {
            stateId = masters.states.get(stateRef.toLowerCase()) || masters.states.get(stateRef);
          }
          if (!stateId && context?.stateId) {
            stateId = context.stateId;
          }

          // Resolve Party, Religion, Caste
          const partyRef = LookupResolverService.extractValue(row, ['Party', 'partyName', 'partyId', 'Party Name']);
          const partyId = partyRef ? masters.parties.get(partyRef.toLowerCase()) : undefined;

          const relRef = LookupResolverService.extractValue(row, ['Religion', 'religionName', 'religionId']);
          const religionId = relRef ? masters.religions.get(relRef.toLowerCase()) : undefined;

          const casteRef = LookupResolverService.extractValue(row, ['Caste', 'Cast', 'casteName', 'casteId']);
          const casteId = casteRef ? masters.castes.get(casteRef.toLowerCase()) : undefined;

          // Demographic attributes
          const ageVal = row['Age'] || row['age'];
          const ageNum = ageVal ? parseInt(ageVal.toString(), 10) : undefined;
          const dobFormatted = formatDateForDb(row['DOB'] || row['dob'] || row['Date of Birth'] || row['date_of_birth']);
          const computedAge = (!isNaN(ageNum as number) && ageNum! > 0) ? ageNum : (dobFormatted ? calculateAge(dobFormatted) : undefined);

          const rawGender = (row['Gender'] || row['gender'] || '').toString().trim().toUpperCase();
          let gender: string | undefined = undefined;
          if (rawGender.startsWith('M')) gender = 'Male';
          else if (rawGender.startsWith('F')) gender = 'Female';
          else if (rawGender.startsWith('T') || rawGender.startsWith('O')) gender = 'Other';

          const voterStatus = row['Status'] || row['status'] || row['Voter Status'] || 'active';
          const voterCategory = row['Category'] || row['category'] || row['Voter Category'] || 'normal';

          // Names, phone numbers & identifiers
          const fullName = LookupResolverService.extractValue(row, ['Full Name', 'Name', 'fullName', 'name', 'Voter Name']) || 'Unknown Voter';
          const nameEn = LookupResolverService.extractValue(row, ['Name (English)', 'nameEn', 'Name_EN', 'name_en']) || fullName;
          const nameHi = LookupResolverService.extractValue(row, ['Name (Hindi)', 'nameHi', 'Name_HI', 'name_hi']) || null;
          const relativeName = LookupResolverService.extractValue(row, ['Relative Name', 'Father/Husband Name', 'relativeName', 'Guardian Name']) || null;
          const relativeType = LookupResolverService.extractValue(row, ['Relative Type', 'Relation', 'relativeType']) || 'Father';
          const mobileNumber = LookupResolverService.extractValue(row, ['Mobile', 'Phone', 'mobileNumber', 'mobile', 'Contact No']) || null;
          const address = LookupResolverService.extractValue(row, ['Address', 'Full Address', 'address', 'House No']) || null;
          const voterAddress = LookupResolverService.extractValue(row, ['Voter Address', 'voterAddress', 'voter_address']) || null;
          const fullAddress = address || voterAddress || null;

          votersToInsert.push({
            epicNo,
            fullName,
            nameEn,
            nameHi,
            relativeName,
            relativeType,
            age: computedAge,
            dob: dobFormatted,
            gender,
            mobileNumber,
            address: fullAddress,
            status: voterStatus,
            voterCategory,
            boothId,
            acId,
            pcId,
            districtId,
            stateId,
            religionId,
            casteId,
            partyId,
            isDead: parseBool(row['Is Dead'] || row['isDead'] || row['is_dead']),
            isShifted: parseBool(row['Is Shifted'] || row['isShifted'] || row['is_shifted']),
            isDuplicate: parseBool(row['Is Duplicate'] || row['isDuplicate'] || row['is_duplicate']),
            isStarred: parseBool(row['Is Starred'] || row['isStarred'] || row['is_starred']),
            houseNumber: LookupResolverService.extractValue(row, ['House No', 'House Number', 'houseNumber', 'house_no']) || null,
            sectionNumber: LookupResolverService.extractValue(row, ['Section No', 'Section Number', 'sectionNumber', 'section_no']) || null,
            sectionName: LookupResolverService.extractValue(row, ['Section Name', 'sectionName', 'section_name']) || null,
            serialNumber: row['SL No'] || row['Serial No'] || row['serialNumber'] || row['sl_no'] || null,
            fullAddress,
            voterAddress,
          });
        }

        if (votersToInsert.length === 0) {
          return { inserted: 0, failed: batchFailed, errors: batchErrors };
        }

        const batchRes = await VoterQueries.createVotersBatch(votersToInsert);

        // Auto-trigger family mapping for all affected booths post-batch
        const uniqueBoothIds = Array.from(new Set(votersToInsert.map((v) => v.boothId).filter(Boolean))) as string[];
        for (const bId of uniqueBoothIds) {
          try {
            await FamilyMappingService.autoMapBoothFamilies(null, { boothId: bId });
          } catch (mapErr: any) {
            logger.warn(`[VoterImportService] Post-import auto family mapping for booth ${bId} encountered error: ${mapErr.message}`);
          }
        }

        return {
          inserted: batchRes.inserted,
          failed: batchFailed + (batchRes.errors || 0),
          errors: batchErrors,
        };
      },
    });

    // Recalculate & synchronize total_voters for all affected booths
    if (allAffectedBoothIds.size > 0) {
      try {
        const boothIdList = Array.from(allAffectedBoothIds);
        logger.info(`[VoterImportService] Updating total_voters count for ${boothIdList.length} affected booths...`);
        const updateCountSql = `
          UPDATE booths b
          SET total_voters = sub.voter_count,
              updated_at = NOW()
          FROM (
            SELECT booth_id, COUNT(*)::int AS voter_count
            FROM voters
            WHERE booth_id = ANY($1::uuid[])
            GROUP BY booth_id
          ) sub
          WHERE b.id = sub.booth_id;
        `;
        await query(updateCountSql, [boothIdList]);
        await CacheService.invalidatePattern('ranniti:masters:booths*');
        logger.info(`[VoterImportService] Successfully updated total_voters count for affected booths.`);
      } catch (err: any) {
        logger.error(`[VoterImportService] Failed to update total_voters count on affected booths:`, err);
      }
    }

    return result;
  }
}
