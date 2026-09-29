import * as XLSX from 'xlsx';
import { logger } from '../utils/logger';
import { VoterQueries } from '../queries/voter.queries';
import { calculateAge, formatDateForDb } from '../utils/dateUtils';
import { Voter, VoterFilterParams, VoterStats, InfluencerOption, FamilyCandidateParams, SocialCandidateParams } from '../models/voter.model';

export class VoterService {
  static async getVoters(params: VoterFilterParams) {
    logger.info(`[VoterService] Fetching voters list (page: ${params.page}, limit: ${params.limit})`);
    return await VoterQueries.getVoters(params);
  }

  static async getVoterById(id: string): Promise<Voter | null> {
    logger.info(`[VoterService] Fetching voter details for id: ${id}`);
    return await VoterQueries.getVoterById(id);
  }

  static async createVoter(data: Partial<Voter>): Promise<Voter> {
    logger.info(`[VoterService] Creating voter with EPIC: ${data.epicNo}`);
    if (data.dob) {
      const computedAge = calculateAge(data.dob);
      if (computedAge !== null) {
        data.age = computedAge;
      }
      data.dob = formatDateForDb(data.dob) || data.dob;
    }
    return await VoterQueries.createVoter(data);
  }

  static async updateVoter(id: string, data: Partial<Voter>): Promise<Voter | null> {
    logger.info(`[VoterService] Updating voter id: ${id}`);
    if (data.dob) {
      const computedAge = calculateAge(data.dob);
      if (computedAge !== null) {
        data.age = computedAge;
      }
      data.dob = formatDateForDb(data.dob) || data.dob;
    }
    if (data.isFamilyInfluencer === true) {
      data.familyInfluencerId = null;
    }
    return await VoterQueries.updateVoter(id, data);
  }

  static async deleteVoter(id: string): Promise<boolean> {
    logger.info(`[VoterService] Deleting voter id: ${id}`);
    return await VoterQueries.deleteVoter(id);
  }

  static async getVoterStats(params: Partial<VoterFilterParams>): Promise<VoterStats> {
    logger.info(`[VoterService] Fetching voter statistics`);
    return await VoterQueries.getVoterStats(params);
  }

  static async getInfluencerOptions(search?: string, boothId?: string, excludeId?: string, type?: string): Promise<InfluencerOption[]> {
    logger.info(`[VoterService] Fetching influencer options (search: ${search}, boothId: ${boothId}, type: ${type})`);
    return await VoterQueries.getInfluencerOptions(search, boothId, excludeId, type);
  }

  static async bulkAssignInfluencer(
    influencerId: string | null,
    influencerType: 'family' | 'social',
    voterIds: string[]
  ): Promise<number> {
    logger.info(`[VoterService] Bulk assigning ${voterIds.length} voters to ${influencerType} influencer ID: ${influencerId}`);
    return await VoterQueries.bulkAssignInfluencer(influencerId, influencerType, voterIds);
  }

  static async exportVotersStream(res: any, params: VoterFilterParams): Promise<void> {
    logger.info(`[VoterService] Exporting voters to Excel for filters: ${JSON.stringify(params)}`);

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

    const dataRows: (string | number)[][] = [headers];

    let page = 1;
    const batchSize = 5000;

    while (true) {
      const rows = await VoterQueries.getVotersForExport(params, page, batchSize);
      if (!rows || rows.length === 0) break;

      for (const r of rows) {
        dataRows.push([
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
        ]);
      }

      if (rows.length < batchSize) break;
      page++;
    }

    const worksheet = XLSX.utils.aoa_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Voters');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="voters_export_${new Date().toISOString().slice(0, 10)}.xlsx"`
    );
    res.send(buffer);
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

