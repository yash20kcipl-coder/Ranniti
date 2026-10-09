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

    // Scope to volunteer's assigned booth IDs or AC ID if restricted
    if (user.assignedBoothIds && user.assignedBoothIds.length > 0) {
      if (filters.boothId) {
        if (!user.assignedBoothIds.includes(filters.boothId)) {
          throw ApiError.forbidden('Access denied to the requested booth');
        }
      } else {
        filters.boothIds = user.assignedBoothIds;
      }
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

    // Inclination and political party guard for creation
    if ((voterData.partyId || (voterData.voterType && voterData.voterType !== 'Voter')) && !perms.canEditInclination) {
      throw ApiError.forbidden('Your role is not allowed to set voter political party or inclination details');
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
}

export const mobileVoterService = new MobileVoterService();
