import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { mobileElectionService } from '../../services/mobile/mobileElection.service';

export class MobileElectionController {
  /**
   * GET /api/v1/mobile/election/voters
   * Fast booth voter list with turnout status and header counters
   */
  getVoters = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const { boothId, electionId, search, serialNo, hasVoted, page, limit } = req.query;

    const result = await mobileElectionService.getPollingVoters(user, {
      boothId: typeof boothId === 'string' ? boothId : undefined,
      electionId: typeof electionId === 'string' ? electionId : undefined,
      search: typeof search === 'string' ? search : undefined,
      serialNo: serialNo ? parseInt(serialNo as string, 10) : undefined,
      hasVoted: hasVoted === 'voted' || hasVoted === 'not_voted' ? hasVoted : 'all',
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });

    const response = ApiResponse.success(result, 'Polling voters retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/mobile/election/mark-voted
   * Instant single-tap toggle
   */
  markVoted = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const { voterId, electionId, boothId, hasVoted } = req.body;

    if (!voterId) {
      throw ApiError.badRequest('Voter ID is required');
    }

    const result = await mobileElectionService.markVoterStatus(user, {
      voterId,
      electionId,
      boothId,
      hasVoted: Boolean(hasVoted),
    });

    const response = ApiResponse.success(result, hasVoted ? 'Voter marked as voted' : 'Voter marked as unvoted');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/mobile/election/batch-sync
   * Bulk sync offline voter turnouts
   */
  batchSync = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const { electionId, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw ApiError.badRequest('Array of items is required for batch sync');
    }

    const result = await mobileElectionService.batchSyncVotes(user, {
      electionId,
      items,
    });

    const response = ApiResponse.success(result, 'Batch voter turnout synced successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/mobile/election/booth-turnout
   * Live booth turnout and hourly surge stats
   */
  getBoothTurnout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const { electionId, boothId } = req.query;

    if (!electionId || typeof electionId !== 'string') {
      throw ApiError.badRequest('Election ID is required');
    }
    if (!boothId || typeof boothId !== 'string') {
      throw ApiError.badRequest('Booth ID is required');
    }

    const result = await mobileElectionService.getBoothTurnout(user, electionId, boothId);
    const response = ApiResponse.success(result, 'Booth turnout retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/mobile/election/whatsapp-templates
   * Pre-approved WhatsApp templates with election date and campaign placeholders
   */
  getWhatsAppTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const result = await mobileElectionService.getWhatsAppTemplates(user);
    const response = ApiResponse.success(result, 'WhatsApp templates retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const mobileElectionController = new MobileElectionController();
