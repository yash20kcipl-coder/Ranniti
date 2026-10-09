import { Request, Response } from 'express';
import { attachFileUrls } from '../../utils/fileUrl';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { mobileVoterService } from '../../services/mobile/mobileVoter.service';

export class MobileVoterController {
  getVoters = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const query = req.query;

    const filters = {
      search: (query.search as string) || '',
      boothId: (query.boothId && query.boothId !== 'All' && query.boothId !== 'all') ? (query.boothId as string) : '',
      acId: (query.acId && query.acId !== 'All' && query.acId !== 'all') ? (query.acId as string) : '',
      pcId: (query.pcId && query.pcId !== 'All' && query.pcId !== 'all') ? (query.pcId as string) : '',
      gender: (query.gender && query.gender !== 'all') ? (query.gender as string) : '',
      voterType: (query.voterType && query.voterType !== 'All' && query.voterType !== 'all') ? (query.voterType as string) : ((query.inclination as string) || ''),
      status: (query.status as string) || (query.isVoted as string) || '',
      isDead: (query.isDead !== undefined && query.isDead !== '' && query.isDead !== 'all') ? (query.isDead as string) : '',
      partyId: (query.partyId && query.partyId !== 'All' && query.partyId !== 'all') ? (query.partyId as string) : '',
      religionId: (query.religionId && query.religionId !== 'All') ? (query.religionId as string) : '',
      casteId: (query.casteId && query.casteId !== 'All') ? (query.casteId as string) : '',
      ageGroup: (query.ageGroup as string) || '',
      isFamilyInfluencer: query.isFamilyInfluencer !== undefined ? String(query.isFamilyInfluencer) === 'true' : undefined,
      isSocialInfluencer: query.isSocialInfluencer !== undefined ? String(query.isSocialInfluencer) === 'true' : undefined,
      influencerRole: (query.influencerRole && query.influencerRole !== 'all') ? (query.influencerRole as string) : '',
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

  getInfluencerOptions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const search = req.query.search as string;
    const boothId = req.query.boothId as string;
    const excludeId = req.query.excludeId as string;
    const type = req.query.type as string;

    const options = await mobileVoterService.getInfluencerOptions(user, { search, boothId, excludeId, type });
    const formattedOptions = attachFileUrls(options, ['avatar'], req);

    const response = ApiResponse.success(formattedOptions, 'Influencer options retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getVoterById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const voterId = req.params.id as string;
    const user = req.mobileUser!;

    const voter = await mobileVoterService.getVoterByIdWithScopeCheck(user, voterId);
    const formattedVoter = attachFileUrls(voter, undefined, req);

    const response = ApiResponse.success(formattedVoter, 'Voter details retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createVoter = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;

    const newVoter = await mobileVoterService.createVoterWithPermissionCheck(
      user,
      req.body
    );
    const formattedVoter = attachFileUrls(newVoter, undefined, req);

    const response = ApiResponse.success(formattedVoter, 'Voter record created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateVoter = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const voterId = req.params.id as string;
    const user = req.mobileUser!;

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
