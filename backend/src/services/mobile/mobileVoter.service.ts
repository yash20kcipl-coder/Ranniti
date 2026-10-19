import { ApiError } from '../../utils/apiError';
import { UserRecord } from '../../queries/auth.queries';
import { VoterQueries } from '../../queries/voter.queries';
import { mobileAccessService } from './mobileAccess.service';
import { VoterFilterParams, Voter } from '../../models/voter.model';

export class MobileVoterService {
  async getAssignedVoters(
    user: Omit<UserRecord, 'passwordHash'>,
    params: VoterFilterParams
  ) {
    const filters: VoterFilterParams = { ...params };
    filters.tenantDbName = user.tenantDbName;

    const isBoothRestrictedRole = user.role === 'supporter' || user.role === 'sub_leader';

    // Scope to volunteer's assigned booth IDs or AC ID if restricted
    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      if (filters.boothId) {
        if (!user.assignedBoothIds.includes(filters.boothId)) {
          throw ApiError.forbidden('Access denied to the requested booth');
        }
      } else {
        filters.boothIds = user.assignedBoothIds;
      }
    } else if (isBoothRestrictedRole) {
      // If a field volunteer has no assigned booths, they must not see unassigned voters
      return {
        data: [],
        total: 0,
        page: Math.max(1, params.page || 1),
        limit: params.limit || 25,
        totalPages: 0,
      };
    } else if (user.assignedAcId && !filters.acId) {
      filters.acId = user.assignedAcId;
    } else if (user.assignedPcId && !filters.pcId) {
      filters.pcId = user.assignedPcId;
    }

    const result = await VoterQueries.getVoters(filters);
    return result;
  }

  async getVoterByIdWithScopeCheck(
    user: Omit<UserRecord, 'passwordHash'>,
    voterId: string
  ): Promise<Voter> {
    const voter = await VoterQueries.getVoterById(voterId, user.tenantDbName);
    if (!voter) {
      throw ApiError.notFound('Voter record not found');
    }

    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      if (voter.boothId && !user.assignedBoothIds.includes(voter.boothId)) {
        throw ApiError.forbidden('Access denied: Voter is outside your assigned booth scope');
      }
    } else if (user.assignedAcId && voter.acId && voter.acId !== user.assignedAcId) {
      throw ApiError.forbidden('Access denied: Voter is outside your assigned AC scope');
    } else if (user.assignedPcId && voter.pcId && voter.pcId !== user.assignedPcId) {
      throw ApiError.forbidden('Access denied: Voter is outside your assigned PC scope');
    }

    return voter;
  }

  async getVoterFamily(
    user: Omit<UserRecord, 'passwordHash'>,
    voterId: string
  ) {
    const voter = await this.getVoterByIdWithScopeCheck(user, voterId);

    const { TenantPoolManager } = await import('../pool/tenantPoolManager');
    const tenantDbName = user.tenantDbName || (user as any).tenant_db_name;

    let members: any[] = [];
    const familyCode = voter.familyId;

    if (familyCode && familyCode.trim()) {
      const sql = `
        SELECT 
          v.id, v.epic_no AS "epicNo", v.serial_no AS "serialNo", v.section_no AS "sectionNo", v.house_no AS "houseNo",
          CONCAT_WS(' ', NULLIF(v.eng_first_name, ''), NULLIF(v.eng_middle_name, ''), NULLIF(v.eng_surname, '')) AS "engName",
          CONCAT_WS(' ', NULLIF(v.first_name, ''), NULLIF(v.middle_name, ''), NULLIF(v.surname, '')) AS "name",
          v.gender, v.age, v.mobile_no AS "mobileNo", v.relation, v.guardian_name AS "guardianName",
          v.avatar, (v.status = 'voted') AS "isVoted", v.party_id AS "partyId", p.name AS "partyName",
          p.symbol_logo AS "partySymbol",
          v.is_family_influencer AS "isFamilyInfluencer", v.family_id AS "familyId"
        FROM voters v
        LEFT JOIN parties p ON v.party_id = p.id
        WHERE v.family_id = $1 AND (v.is_dead IS NOT TRUE)
        ORDER BY v.age DESC, v.serial_no ASC
      `;
      const res = await TenantPoolManager.query(tenantDbName, sql, [familyCode.trim()]);
      members = res.rows;
    }

    // Fallback if no familyId or only 1 member found: match voters by booth and house_no
    if (members.length <= 1 && voter.boothId && voter.houseNo && voter.houseNo !== 'N/A') {
      const sqlFallback = `
        SELECT 
          v.id, v.epic_no AS "epicNo", v.serial_no AS "serialNo", v.section_no AS "sectionNo", v.house_no AS "houseNo",
          CONCAT_WS(' ', NULLIF(v.eng_first_name, ''), NULLIF(v.eng_middle_name, ''), NULLIF(v.eng_surname, '')) AS "engName",
          CONCAT_WS(' ', NULLIF(v.first_name, ''), NULLIF(v.middle_name, ''), NULLIF(v.surname, '')) AS "name",
          v.gender, v.age, v.mobile_no AS "mobileNo", v.relation, v.guardian_name AS "guardianName",
          v.avatar, (v.status = 'voted') AS "isVoted", v.party_id AS "partyId", p.name AS "partyName",
          p.symbol_logo AS "partySymbol",
          v.is_family_influencer AS "isFamilyInfluencer", v.family_id AS "familyId"
        FROM voters v
        LEFT JOIN parties p ON v.party_id = p.id
        WHERE v.booth_id = $1 AND v.house_no = $2 AND (v.is_dead IS NOT TRUE)
        ORDER BY v.age DESC, v.serial_no ASC
      `;
      const resFallback = await TenantPoolManager.query(tenantDbName, sqlFallback, [voter.boothId, voter.houseNo]);
      if (resFallback.rows.length > 0) {
        members = resFallback.rows;
      }
    }

    if (members.length === 0) {
      members = [{
        id: voter.id,
        epicNo: voter.epicNo,
        serialNo: voter.serialNo,
        sectionNo: voter.sectionNo,
        houseNo: voter.houseNo,
        engName: `${voter.engFirstName || ''} ${voter.engSurname || ''}`.trim(),
        name: `${voter.firstName || ''} ${voter.surname || ''}`.trim(),
        gender: voter.gender,
        age: voter.age,
        mobileNo: voter.mobileNo,
        relation: voter.relation,
        guardianName: voter.guardianName,
        avatar: voter.avatar,
        isVoted: (voter.status === 'voted'),
        partyId: voter.partyId,
        partyName: voter.partyName,
        isFamilyInfluencer: voter.isFamilyInfluencer,
        familyId: voter.familyId,
      }];
    }

    const head = members.find((m) => m.isFamilyInfluencer) || members[0];
    const votedCount = members.filter((m) => m.isVoted).length;

    return {
      familyId: familyCode || head.familyId || `FAM-${voter.houseNo || 'NA'}`,
      houseNo: voter.houseNo || head.houseNo || '',
      head,
      members,
      totalMembers: members.length,
      votedMembers: votedCount,
    };
  }

  async getInfluencerOptions(
    user: Omit<UserRecord, 'passwordHash'>,
    params: { search?: string; boothId?: string; excludeId?: string; type?: string }
  ) {
    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      if (params.boothId && !user.assignedBoothIds.includes(params.boothId)) {
        throw ApiError.forbidden('Access denied: Booth is outside your assigned scope');
      }
    }
    const { VoterService } = await import('../tenant/voter.service');
    return await VoterService.getInfluencerOptions(
      params.search,
      params.boothId,
      params.excludeId,
      params.type,
      user.tenantDbName
    );
  }

  async getFamilyCandidates(
    user: Omit<UserRecord, 'passwordHash'>,
    params: any
  ) {
    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      if (params.boothId && !user.assignedBoothIds.includes(params.boothId)) {
        throw ApiError.forbidden('Access denied: Booth is outside your assigned scope');
      }
    }
    const { VoterService } = await import('../tenant/voter.service');
    return await VoterService.getFamilyCandidates({
      ...params,
      tenantDbName: user.tenantDbName,
    });
  }

  async getSocialCandidates(
    user: Omit<UserRecord, 'passwordHash'>,
    params: any
  ) {
    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      if (params.boothId && !user.assignedBoothIds.includes(params.boothId)) {
        throw ApiError.forbidden('Access denied: Booth is outside your assigned scope');
      }
    }
    const { VoterService } = await import('../tenant/voter.service');
    return await VoterService.getSocialCandidates({
      ...params,
      tenantDbName: user.tenantDbName,
    });
  }

  async bulkAssignInfluencer(
    user: Omit<UserRecord, 'passwordHash'>,
    payload: {
      influencerId: string | null;
      influencerType: 'family' | 'social';
      voterIds: string[];
    }
  ) {
    const roleAccess = await mobileAccessService.getRoleAccessConfig({
      role: user.role,
      tenantDbName: user.tenantDbName,
    });
    if (!roleAccess.voterPermissions.canManageFamily) {
      throw ApiError.forbidden('Your role is not allowed to manage influencer relationships');
    }

    const { VoterService } = await import('../tenant/voter.service');
    return await VoterService.bulkAssignInfluencer(
      payload.influencerId || null,
      payload.influencerType,
      payload.voterIds,
      user.tenantDbName
    );
  }

  async createVoterWithPermissionCheck(
    user: Omit<UserRecord, 'passwordHash'>,
    voterData: Partial<Voter>
  ): Promise<Voter> {
    const roleAccess = await mobileAccessService.getRoleAccessConfig({
      role: user.role,
      tenantDbName: user.tenantDbName,
    });
    const perms = roleAccess.voterPermissions;

    if (!perms.canCreateVoter) {
      throw ApiError.forbidden('Your role is not allowed to create new voter records');
    }

    const rawData = voterData as any;
    const voterName = (
      rawData.name ||
      rawData.engFirstName ||
      rawData.firstName ||
      [rawData.engFirstName, rawData.engMiddleName, rawData.engSurname].filter(Boolean).join(' ') ||
      ''
    ).trim();
    if (!voterName && !rawData.epicNo) {
      throw ApiError.badRequest('Voter name or EPIC number is required');
    }
    if (!voterData.firstName && voterName) {
      voterData.firstName = voterName;
    }
    if (!voterData.engFirstName && voterName) {
      voterData.engFirstName = voterName;
    }
    if (rawData.relativeName && !voterData.guardianName) {
      voterData.guardianName = rawData.relativeName;
    }
    if (rawData.mobile && !voterData.mobileNo) {
      voterData.mobileNo = rawData.mobile;
    }
    if (rawData.address && !voterData.fullAddress) {
      voterData.fullAddress = rawData.address;
    }

    // Geographic scope guard for creation
    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      if (!voterData.boothId) {
        voterData.boothId = user.assignedBoothIds[0];
      } else if (!user.assignedBoothIds.includes(voterData.boothId)) {
        throw ApiError.forbidden('Access denied: You cannot add voters to unassigned booths');
      }
    }

    if (user.assignedAcId && !voterData.acId) {
      voterData.acId = user.assignedAcId;
    }
    if (user.assignedPcId && !voterData.pcId) {
      voterData.pcId = user.assignedPcId;
    }

    // Contact field guard for creation
    const contactKeys = [
      'mobileNo', 'email', 'houseNo', 'streetName', 'address',
      'fullAddress', 'voterAddress', 'village', 'taluka'
    ];
    const specifiesContact = contactKeys.some(key => Boolean((voterData as any)[key]));
    if (specifiesContact && !perms.canEditContact) {
      throw ApiError.forbidden('Your role is not allowed to set voter contact details');
    }

    // Demographic field guard for creation (non-essential optional attributes)
    const demographicKeys = [
      'casteId', 'casteName', 'religionId', 'religionName',
      'subcasteName', 'bloodGroup', 'professionType', 'profession',
      'avatar', 'aadhaarNo', 'panNo', 'dob'
    ];
    const specifiesDemographics = demographicKeys.some(key => Boolean((voterData as any)[key]));
    if (specifiesDemographics && !perms.canEditDemographics) {
      throw ApiError.forbidden('Your role is not allowed to set voter demographic details');
    }

    // Inclination and political party guard for creation
    const specifiesInclination =
      (voterData.partyId !== undefined && voterData.partyId !== null) ||
      (voterData.voterType !== undefined && voterData.voterType !== null && voterData.voterType !== 'Voter');
    if (specifiesInclination && !perms.canEditInclination) {
      throw ApiError.forbidden('Your role is not allowed to set voter political party or inclination details');
    }

    // Voter status field guard for creation
    const statusKeys = ['status', 'isDead', 'isShifted', 'isVoted'];
    const specifiesStatus = statusKeys.some(key => {
      const val = (voterData as any)[key];
      return val !== undefined && val !== null && val !== false && val !== 'Active';
    });
    if (specifiesStatus && !perms.canEditVoterStatus) {
      throw ApiError.forbidden('Your role is not allowed to set voter status flags');
    }

    // Family / Social Influencer field guard for creation
    const familyKeys = [
      'familyInfluencerId', 'socialInfluencerId', 'isFamilyInfluencer', 'isSocialInfluencer',
      'influencerRole', 'familyId'
    ];
    const specifiesFamily = familyKeys.some(key => Boolean((voterData as any)[key]));
    if (specifiesFamily && !perms.canManageFamily) {
      throw ApiError.forbidden('Your role is not allowed to set voter influencer tags');
    }

    const { VoterService } = await import('../tenant/voter.service');
    const newVoter = await VoterService.createVoter(voterData, user.tenantDbName);
    return newVoter;
  }

  async updateVoterWithPermissionCheck(
    user: Omit<UserRecord, 'passwordHash'>,
    voterId: string,
    updateData: Partial<Voter>
  ): Promise<Voter> {
    const roleAccess = await mobileAccessService.getRoleAccessConfig({
      role: user.role,
      tenantDbName: user.tenantDbName,
    });
    const perms = roleAccess.voterPermissions;

    if (!perms.canViewVoter) {
      throw ApiError.forbidden('You do not have permission to access voter records');
    }

    // Verify existing voter scope
    const existingVoter = await VoterQueries.getVoterById(voterId, user.tenantDbName);
    if (!existingVoter) {
      throw ApiError.notFound('Voter record not found');
    }

    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      if (existingVoter.boothId && !user.assignedBoothIds.includes(existingVoter.boothId)) {
        throw ApiError.forbidden('Access denied: Voter is outside your assigned booth scope');
      }
    } else if (user.assignedAcId && existingVoter.acId && existingVoter.acId !== user.assignedAcId) {
      throw ApiError.forbidden('Access denied: Voter is outside your assigned AC scope');
    } else if (user.assignedPcId && existingVoter.pcId && existingVoter.pcId !== user.assignedPcId) {
      throw ApiError.forbidden('Access denied: Voter is outside your assigned PC scope');
    }

    // Contact field guard
    const contactKeys = [
      'mobileNo', 'email', 'houseNo', 'streetName', 'address',
      'fullAddress', 'voterAddress', 'village', 'taluka'
    ];
    const modifiesContact = contactKeys.some(key => key in updateData);
    if (modifiesContact && !perms.canEditContact) {
      throw ApiError.forbidden('Your role is not allowed to edit voter contact details');
    }

    // Demographic field guard
    const demographicKeys = [
      'name', 'firstName', 'middleName', 'surname', 'engFirstName', 'engMiddleName', 'engSurname',
      'relativeName', 'guardianName', 'relation', 'casteId', 'casteName', 'religionId', 'religionName',
      'subcasteName', 'gender', 'dob', 'age', 'bloodGroup', 'professionType', 'profession',
      'avatar', 'aadhaarNo', 'panNo'
    ];
    const modifiesDemographics = demographicKeys.some(key => key in updateData);
    if (modifiesDemographics && !perms.canEditDemographics) {
      throw ApiError.forbidden('Your role is not allowed to edit voter demographic details');
    }

    // Inclination field guard
    const inclinationKeys = ['voterType', 'partyId'];
    const modifiesInclination = inclinationKeys.some(key => key in updateData);
    if (modifiesInclination && !perms.canEditInclination) {
      throw ApiError.forbidden('Your role is not allowed to edit voter inclination/party details');
    }

    // Voter status field guard
    const statusKeys = ['status', 'isDead', 'isShifted', 'isVoted'];
    const modifiesStatus = statusKeys.some(key => key in updateData);
    if (modifiesStatus && !perms.canEditVoterStatus) {
      throw ApiError.forbidden('Your role is not allowed to edit voter status');
    }

    // Family / Social Influencer field guard
    const familyKeys = [
      'familyInfluencerId', 'socialInfluencerId', 'isFamilyInfluencer', 'isSocialInfluencer',
      'influencerRole', 'familyId'
    ];
    const modifiesFamily = familyKeys.some(key => key in updateData);
    if (modifiesFamily && !perms.canManageFamily) {
      throw ApiError.forbidden('Your role is not allowed to modify voter influencer tags');
    }

    const { VoterService } = await import('../tenant/voter.service');
    const updated = await VoterService.updateVoter(voterId, updateData, user.tenantDbName);
    if (!updated) {
      throw ApiError.notFound('Voter record not found or update failed');
    }
    return updated;
  }

  /**
   * Fetch aggregated societies/areas scoped to mobile user permissions
   */
  async getAssignedSocieties(
    user: Omit<UserRecord, 'passwordHash'>,
    params: {
      search?: string;
      boothId?: string;
      acId?: string;
      wardId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const filters: {
      search?: string;
      boothId?: string;
      boothIds?: string[];
      acId?: string;
      wardId?: string;
      page?: number;
      limit?: number;
    } = { ...params };
    const tenantDbName = user.tenantDbName;

    const isBoothRestrictedRole = user.role === 'supporter' || user.role === 'sub_leader';

    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      if (filters.boothId) {
        if (!user.assignedBoothIds.includes(filters.boothId)) {
          throw ApiError.forbidden('Access denied to the requested booth');
        }
      } else {
        filters.boothIds = user.assignedBoothIds;
      }
    } else if (isBoothRestrictedRole) {
      // If a field volunteer has no assigned booths, return empty societies
      return {
        data: [],
        total: 0,
        page: Math.max(1, Number(params.page) || 1),
        limit: Math.max(1, Math.min(100, Number(params.limit) || 20)),
        totalPages: 0,
      };
    } else if (user.assignedAcId && !filters.acId) {
      filters.acId = user.assignedAcId;
    }

    return await VoterQueries.getSocietiesPaginated(filters, tenantDbName);
  }
}

export const mobileVoterService = new MobileVoterService();
