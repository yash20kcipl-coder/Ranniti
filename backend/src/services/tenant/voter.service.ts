import ExcelJS from 'exceljs';
import { logger } from '../../utils/logger';
import { VoterQueries } from '../../queries/voter.queries';
import { MasterQueries } from '../../queries/master.queries';
import { FamilyMappingService } from './familyMapping.service';
import { calculateAge, formatDateForDb } from '../../utils/dateUtils';
import { Voter, VoterFilterParams, VoterStats, InfluencerOption, FamilyCandidateParams, SocialCandidateParams } from '../../models/voter.model';

export class VoterService {
  static async getVoters(params: VoterFilterParams) {
    logger.info(`[VoterService] Fetching voters list (page: ${params.page}, limit: ${params.limit})`);
    return await VoterQueries.getVoters(params);
  }

  static async getVoterById(id: string, tenantDbName?: string | null): Promise<Voter | null> {
    logger.info(`[VoterService] Fetching voter details for id: ${id}`);
    return await VoterQueries.getVoterById(id, tenantDbName);
  }

  static async createVoter(data: Partial<Voter>, tenantDbName?: string | null): Promise<Voter> {
    logger.info(`[VoterService] Creating voter with EPIC: ${data.epicNo}`);
    if (data.dob) {
      const computedAge = calculateAge(data.dob);
      if (computedAge !== null) {
        data.age = computedAge;
      }
      data.dob = formatDateForDb(data.dob) || data.dob;
    }

    // Auto-upsert Taluka and Village if provided as string names
    let talukaId: string | null = null;
    if (data.taluka) {
      talukaId = await MasterQueries.upsertTalukaByName(data.taluka, data.districtId || undefined);
    }
    if (data.village) {
      await MasterQueries.upsertVillageByName(data.village, talukaId || undefined);
    }

    // Auto-upsert Religion, Caste, and Subcaste
    const isUuid = (val?: string | null) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

    if (data.religionName && data.religionName.trim()) {
      const resolvedRelId = await MasterQueries.upsertReligionByName(data.religionName.trim());
      if (resolvedRelId) data.religionId = resolvedRelId;
    } else if (data.religionId && !isUuid(data.religionId)) {
      const resolvedRelId = await MasterQueries.upsertReligionByName(data.religionId);
      if (resolvedRelId) data.religionId = resolvedRelId;
    }

    if (data.casteName && data.casteName.trim()) {
      const resolvedCasteId = await MasterQueries.upsertCasteByName(data.casteName.trim(), data.religionId);
      if (resolvedCasteId) data.casteId = resolvedCasteId;
    } else if (data.casteId && !isUuid(data.casteId)) {
      const resolvedCasteId = await MasterQueries.upsertCasteByName(data.casteId, data.religionId);
      if (resolvedCasteId) data.casteId = resolvedCasteId;
    }

    if (data.subcasteName && data.subcasteName.trim()) {
      await MasterQueries.upsertSubcasteByName(data.subcasteName.trim(), data.casteId, data.religionId);
    }

    // Auto family mapping assignment if not explicitly provided
    if (!data.familyId) {
      const familyAssigned = await FamilyMappingService.assignVoterToFamily(data);
      data.familyId = familyAssigned.familyId;
      data.isFamilyInfluencer = familyAssigned.isFamilyInfluencer;
      data.familyInfluencerId = familyAssigned.familyInfluencerId;
    }

    return await VoterQueries.createVoter(data, tenantDbName);
  }

  static async updateVoter(id: string, data: Partial<Voter>, tenantDbName?: string | null): Promise<Voter | null> {
    logger.info(`[VoterService] Updating voter id: ${id}`);
    if (data.dob) {
      const computedAge = calculateAge(data.dob);
      if (computedAge !== null) {
        data.age = computedAge;
      }
      data.dob = formatDateForDb(data.dob) || data.dob;
    }

    // Auto-upsert Taluka and Village if provided as string names
    let talukaId: string | null = null;
    if (data.taluka) {
      talukaId = await MasterQueries.upsertTalukaByName(data.taluka, data.districtId || undefined);
    }
    if (data.village) {
      await MasterQueries.upsertVillageByName(data.village, talukaId || undefined);
    }

    // Auto-upsert Religion, Caste, and Subcaste
    const isUuid = (val?: string | null) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

    if (data.religionName && data.religionName.trim()) {
      const resolvedRelId = await MasterQueries.upsertReligionByName(data.religionName.trim());
      if (resolvedRelId) data.religionId = resolvedRelId;
    } else if (data.religionId && !isUuid(data.religionId)) {
      const resolvedRelId = await MasterQueries.upsertReligionByName(data.religionId);
      if (resolvedRelId) data.religionId = resolvedRelId;
    }

    if (data.casteName && data.casteName.trim()) {
      const resolvedCasteId = await MasterQueries.upsertCasteByName(data.casteName.trim(), data.religionId);
      if (resolvedCasteId) data.casteId = resolvedCasteId;
    } else if (data.casteId && !isUuid(data.casteId)) {
      const resolvedCasteId = await MasterQueries.upsertCasteByName(data.casteId, data.religionId);
      if (resolvedCasteId) data.casteId = resolvedCasteId;
    }

    if (data.subcasteName && data.subcasteName.trim()) {
      await MasterQueries.upsertSubcasteByName(data.subcasteName.trim(), data.casteId, data.religionId);
    }

    if (data.isFamilyInfluencer === true) {
      data.familyInfluencerId = null;
    }
    return await VoterQueries.updateVoter(id, data, tenantDbName);
  }

  static async deleteVoter(id: string, tenantDbName?: string | null): Promise<boolean> {
    logger.info(`[VoterService] Deleting voter id: ${id}`);
    return await VoterQueries.deleteVoter(id, tenantDbName);
  }

  static async getVoterStats(params: Partial<VoterFilterParams>): Promise<VoterStats> {
    logger.info(`[VoterService] Fetching voter statistics`);
    return await VoterQueries.getVoterStats(params);
  }

  static async getInfluencerOptions(search?: string, boothId?: string, excludeId?: string, type?: string, tenantDbName?: string | null): Promise<InfluencerOption[]> {
    logger.info(`[VoterService] Fetching influencer options (search: ${search}, boothId: ${boothId}, type: ${type})`);
    return await VoterQueries.getInfluencerOptions(search, boothId, excludeId, type, tenantDbName);
  }

  static async bulkAssignInfluencer(
    influencerId: string | null,
    influencerType: 'family' | 'social',
    voterIds: string[],
    tenantDbName?: string | null
  ): Promise<number> {
    logger.info(`[VoterService] Bulk assigning ${voterIds.length} voters to ${influencerType} influencer ID: ${influencerId}`);
    return await VoterQueries.bulkAssignInfluencer(influencerId, influencerType, voterIds, tenantDbName);
  }

  static async exportVotersStream(res: any, params: VoterFilterParams): Promise<void> {
    logger.info(`[VoterService] Streaming voters export to Excel for filters: ${JSON.stringify(params)}`);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="voters_export_${new Date().toISOString().slice(0, 10)}.xlsx"`
    );

    const headers = [
      'EPIC No',
      'First Name (Eng)',
      'Middle Name (Eng)',
      'Surname (Eng)',
      'First Name (Local)',
      'Middle Name (Local)',
      'Surname (Local)',
      'Gender',
      'Age',
      'DOB',
      'Mobile No',
      'Email',
      'Aadhaar No',
      'PAN No',
      'House No',
      'Serial No',
      'Section No',
      'Booth Name',
      'Booth No',
      'AC Name',
      'PC Name',
      'District Name',
      'State Name',
      'Religion',
      'Caste',
      'Subcaste',
      'Voter Type',
      'Status',
      'Is Dead',
      'Blood Group',
      'Taluka',
      'Village',
      'Full Address',
      'Voter Address',
      'Party Name',
      'Family Influencer',
      'Is Family Influencer',
      'Family Influenced Count',
      'Social Influencer',
      'Is Social Influencer',
      'Social Influenced Count',
    ];

    // High-performance streaming workbook writer directly piped to HTTP response
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true,
      useSharedStrings: false,
    });

    const worksheet = workbook.addWorksheet('Voters');
    worksheet.addRow(headers).commit();

    let page = 1;
    const batchSize = 2500;

    while (true) {
      const rows = await VoterQueries.getVotersForExport(params, page, batchSize);
      if (!rows || rows.length === 0) break;

      for (const r of rows) {
        worksheet.addRow([
          r.epicNo || '',
          r.engFirstName || '',
          r.engMiddleName || '',
          r.engSurname || '',
          r.firstName || '',
          r.middleName || '',
          r.surname || '',
          r.gender || '',
          r.age ?? '',
          r.dob ? String(r.dob).split('T')[0] : '',
          r.mobileNo || '',
          r.email || '',
          r.aadhaarNo || '',
          r.panNo || '',
          r.houseNo || '',
          r.serialNo ?? '',
          r.sectionNo ?? '',
          r.boothName || '',
          r.boothNumber ?? '',
          r.acName || '',
          r.pcName || '',
          r.districtName || '',
          r.stateName || '',
          r.religionName || '',
          r.casteName || '',
          r.subcasteName || '',
          r.voterType || '',
          r.status || '',
          r.isDead ? 'YES' : 'NO',
          r.bloodGroup || '',
          r.taluka || '',
          r.village || '',
          r.fullAddress || '',
          r.voterAddress || '',
          r.partyName || '',
          r.familyInfluencerName || '',
          Number(r.familyInfluencedCount) > 0 ? 'YES' : 'NO',
          Number(r.familyInfluencedCount) || 0,
          r.socialInfluencerName || '',
          Number(r.socialInfluencedCount) > 0 ? 'YES' : 'NO',
          Number(r.socialInfluencedCount) || 0,
        ]).commit();
      }

      if (rows.length < batchSize) break;
      page++;
    }

    await worksheet.commit();
    await workbook.commit();
  }

  static async getFamilyCandidates(params: FamilyCandidateParams) {
    logger.info(`[VoterService] Fetching family candidates for influencerId: ${params.influencerId} (page: ${params.page})`);
    return await VoterQueries.getFamilyCandidates(params);
  }

  static async getSocialCandidates(params: SocialCandidateParams) {
    logger.info(`[VoterService] Fetching social candidates for influencerId: ${params.influencerId} (page: ${params.page})`);
    return await VoterQueries.getSocialCandidates(params);
  }
}

