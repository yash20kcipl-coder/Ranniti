import { Request, Response } from 'express';
import { attachFileUrls } from '../../utils/fileUrl';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { mobileAuthService } from '../../services/mobileAuth.service';
import { mobileVoterService } from '../../services/mobile/mobileVoter.service';

export class MobileVoterController {
  getVoters = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const user = await mobileAuthService.getMobileProfile(userId);
    const query = req.query;

    const filters = {
      search: (query.search as string) || '',
      boothId: (query.boothId as string) || '',
      acId: (query.acId as string) || '',
      pcId: (query.pcId as string) || '',
      gender: (query.gender as string) || '',
      voterType: (query.voterType as string) || (query.inclination as string) || '',
      status: (query.status as string) || '',
      isDead: (query.isDead as string) || '',
      partyId: (query.partyId as string) || '',
      religionId: (query.religionId as string) || '',
      casteId: (query.casteId as string) || '',
      ageGroup: (query.ageGroup as string) || '',
      isFamilyInfluencer: query.isFamilyInfluencer !== undefined ? String(query.isFamilyInfluencer) === 'true' : undefined,
      isSocialInfluencer: query.isSocialInfluencer !== undefined ? String(query.isSocialInfluencer) === 'true' : undefined,
      influencerRole: (query.influencerRole as string) || '',
      page: query.page ? parseInt(query.page as string, 10) : 1,
      limit: query.limit ? parseInt(query.limit as string, 10) : 25,
    };

    const result = await mobileVoterService.getAssignedVoters(user, filters);
    const formattedData = result.data.map(voter => attachFileUrls(voter, undefined, req));

    const response = ApiResponse.success(
      {
        voters: formattedData,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      },
      'Voter list retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  updateVoter = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const voterId = req.params.id as string;
    const user = await mobileAuthService.getMobileProfile(userId);

    const updatedVoter = await mobileVoterService.updateVoterWithPermissionCheck(
      user,
      voterId,
      req.body
    );
    const formattedVoter = attachFileUrls(updatedVoter, undefined, req);

    const response = ApiResponse.success(formattedVoter, 'Voter record updated successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const mobileVoterController = new MobileVoterController();
