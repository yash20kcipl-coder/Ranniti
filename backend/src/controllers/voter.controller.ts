import { Request, Response } from 'express';
import { attachFileUrls } from '../utils/fileUrl';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { VoterService } from '../services/voter.service';
import { VoterFilterParams, FamilyCandidateParams, SocialCandidateParams } from '../models/voter.model';

export class VoterController {
  static getVoters = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filterParams: VoterFilterParams = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 25,
      search: req.query.search as string,
      stateId: req.query.stateId as string,
      districtId: req.query.districtId as string,
      boothId: req.query.boothId as string,
      acId: req.query.acId as string,
      gender: req.query.gender as string,
      voterType: req.query.voterType as string,
      status: req.query.status as string,
      isDead: req.query.isDead as string,
      religionId: req.query.religionId as string,
      casteId: req.query.casteId as string,
      partyId: req.query.partyId as string,
      ageGroup: req.query.ageGroup as string,
      familyInfluencerId: req.query.familyInfluencerId as string,
      socialInfluencerId: req.query.socialInfluencerId as string,
      isFamilyInfluencer: req.query.isFamilyInfluencer as string,
      isSocialInfluencer: req.query.isSocialInfluencer as string,
      influencerStatus: req.query.influencerStatus as string,
      influencerRole: req.query.influencerRole as string,
      organizationId: req.query.organizationId as string,
    };

    const result = await VoterService.getVoters(filterParams);
    const formattedData = attachFileUrls(result.data, ['avatar', 'partySymbol'], req);
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
      'Voters retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  static getVoterById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const voter = await VoterService.getVoterById(id);
    if (!voter) {
      const errRes = ApiResponse.error('Voter record not found', 404);
      res.status(errRes.statusCode).json(errRes.body);
      return;
    }
    const formattedVoter = attachFileUrls(voter, ['avatar', 'partySymbol'], req);
    const response = ApiResponse.success(formattedVoter, 'Voter retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  static createVoter = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const newVoter = await VoterService.createVoter(req.body);
    const formattedVoter = attachFileUrls(newVoter, ['avatar'], req);
    const response = ApiResponse.success(formattedVoter, 'Voter created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  static updateVoter = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const updatedVoter = await VoterService.updateVoter(id, req.body);
    if (!updatedVoter) {
      const errRes = ApiResponse.error('Voter not found or update failed', 404);
      res.status(errRes.statusCode).json(errRes.body);
      return;
    }
    const formattedVoter = attachFileUrls(updatedVoter, ['avatar', 'partySymbol'], req);
    const response = ApiResponse.success(formattedVoter, 'Voter updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  static deleteVoter = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const success = await VoterService.deleteVoter(id);
    if (!success) {
      const errRes = ApiResponse.error('Voter not found or deletion failed', 404);
      res.status(errRes.statusCode).json(errRes.body);
      return;
    }
    const response = ApiResponse.success(null, 'Voter deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  static getVoterStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filterParams: Partial<VoterFilterParams> = {
      boothId: req.query.boothId as string,
      acId: req.query.acId as string,
      organizationId: req.query.organizationId as string,
    };
    const stats = await VoterService.getVoterStats(filterParams);
    const response = ApiResponse.success(stats, 'Voter statistics retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  static getInfluencerOptions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const search = req.query.search as string;
    const boothId = req.query.boothId as string;
    const excludeId = req.query.excludeId as string;
    const type = req.query.type as string;

    const options = await VoterService.getInfluencerOptions(search, boothId, excludeId, type);
    const response = ApiResponse.success(options, 'Influencer options retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  static bulkAssignInfluencer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { influencerId, influencerType, voterIds } = req.body;
    const count = await VoterService.bulkAssignInfluencer(
      influencerId || null,
      influencerType,
      voterIds
    );
    const response = ApiResponse.success({ updatedCount: count }, `${count} voters successfully linked to influencer`);
    res.status(response.statusCode).json(response.body);
  });

  static exportVoters = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filterParams: VoterFilterParams = {
      search: req.query.search as string,
      boothId: req.query.boothId as string,
      acId: req.query.acId as string,
      gender: req.query.gender as string,
      voterType: req.query.voterType as string,
      status: req.query.status as string,
      isDead: req.query.isDead as string,
      religionId: req.query.religionId as string,
      casteId: req.query.casteId as string,
      partyId: req.query.partyId as string,
      isFamilyInfluencer: req.query.isFamilyInfluencer as string,
      isSocialInfluencer: req.query.isSocialInfluencer as string,
      organizationId: req.query.organizationId as string,
    };

    await VoterService.exportVotersStream(res, filterParams);
  });

  static getFamilyCandidates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const params: FamilyCandidateParams = {
      influencerId: req.query.influencerId as string,
      boothId: req.query.boothId as string,
      search: req.query.search as string,
      houseNo: req.query.houseNo as string,
      sameHouseOnly: req.query.sameHouseOnly as string,
      sameSurnameOnly: req.query.sameSurnameOnly as string,
      unassignedOnly: req.query.unassignedOnly as string,
      sectionNo: req.query.sectionNo ? Number(req.query.sectionNo) : undefined,
      gender: req.query.gender as string,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
    };

    const result = await VoterService.getFamilyCandidates(params);

    const transformedCandidates = attachFileUrls(result.data, ['avatar'], req);
    const transformedInfluencer = result.influencer
      ? attachFileUrls([result.influencer], ['avatar'], req)[0]
      : null;

    const response = ApiResponse.success(
      {
        voters: transformedCandidates,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        influencer: transformedInfluencer,
      },
      'Family candidates retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  static getSocialCandidates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const params: SocialCandidateParams = {
      influencerId: req.query.influencerId as string,
      boothId: req.query.boothId as string,
      search: req.query.search as string,
      sectionNo: req.query.sectionNo ? Number(req.query.sectionNo) : undefined,
      gender: req.query.gender as string,
      voterType: req.query.voterType as string,
      casteId: req.query.casteId as string,
      unassignedOnly: req.query.unassignedOnly as string,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
    };

    const result = await VoterService.getSocialCandidates(params);

    const transformedCandidates = attachFileUrls(result.data, ['avatar'], req);
    const transformedInfluencer = result.influencer
      ? attachFileUrls([result.influencer], ['avatar'], req)[0]
      : null;

    const response = ApiResponse.success(
      {
        voters: transformedCandidates,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        influencer: transformedInfluencer,
      },
      'Social influencer candidate voters retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });
}
