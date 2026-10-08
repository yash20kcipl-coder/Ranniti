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

    // Contact field guard
    const contactKeys = ['mobileNo', 'email', 'houseNo', 'streetName'];
    const modifiesContact = contactKeys.some(key => key in updateData);
    if (modifiesContact && !perms.canEditContact) {
      throw ApiError.forbidden('Your role is not allowed to edit voter contact details');
    }

    // Demographic field guard
    const demographicKeys = ['casteId', 'religionId', 'gender', 'dob', 'age'];
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
    const statusKeys = ['status', 'isDead', 'isShifted'];
    const modifiesStatus = statusKeys.some(key => key in updateData);
    if (modifiesStatus && !perms.canEditVoterStatus) {
      throw ApiError.forbidden('Your role is not allowed to edit voter status');
    }

    // Family / Social Influencer field guard
    const familyKeys = ['familyInfluencerId', 'socialInfluencerId', 'isFamilyInfluencer', 'isSocialInfluencer', 'influencerRole'];
    const modifiesFamily = familyKeys.some(key => key in updateData);
    if (modifiesFamily && !perms.canManageFamily) {
      throw ApiError.forbidden('Your role is not allowed to modify voter influencer tags');
    }

    const updated = await VoterQueries.updateVoter(voterId, updateData, user.tenantDbName);
    if (!updated) {
      throw ApiError.notFound('Voter record not found or update failed');
    }
    return updated;
  }
}

export const mobileVoterService = new MobileVoterService();
