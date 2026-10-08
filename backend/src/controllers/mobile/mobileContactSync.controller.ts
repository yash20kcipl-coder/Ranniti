import { Request, Response } from 'express';
import { attachFileUrls } from '../../utils/fileUrl';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { mobileContactSyncService } from '../../services/mobile/mobileContactSync.service';

export class MobileContactSyncController {
  /**
   * Synchronizes mobile device contacts with constituency voter rolls.
   * Accepts { contacts: Array<{ name, phone }> } or { phoneNumbers: string[] }
   */
  syncContacts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const { contacts, phoneNumbers, emails = [] } = req.body;

    const rawList = contacts || phoneNumbers || [];

    if (!Array.isArray(rawList)) {
      res.status(400).json(ApiResponse.error('contacts must be an array of contact objects or phone numbers', 400).body);
      return;
    }

    const result = await mobileContactSyncService.syncContacts(user, rawList, emails);
    const formattedVoters = result.matchedVoters.map(voter => attachFileUrls(voter, undefined, req));

    const response = ApiResponse.success(
      {
        totalSubmitted: result.totalSubmitted,
        validIndianMobiles: result.validIndianMobiles,
        totalMatched: result.totalMatched,
        matchedVoters: formattedVoters,
      },
      'Contact list synchronized successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  /**
   * Retrieves paginated list of voter contacts previously matched & synced by this user.
   */
  getSyncedContacts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;

    const { page, limit, search, boothId, voterType } = req.query;

    const result = await mobileContactSyncService.getSyncedContacts(user, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search ? String(search) : undefined,
      boothId: boothId ? String(boothId) : undefined,
      voterType: voterType ? String(voterType) : undefined,
    });

    const formattedItems = result.items.map(item => attachFileUrls(item, undefined, req));

    const response = ApiResponse.success(
      {
        items: formattedItems,
        pagination: result.pagination,
      },
      'Synced contacts retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  /**
   * Unlinks a matched voter contact from this user's synced contacts list.
   */
  removeSyncedContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const voterId = String(req.params.voterId);

    if (!voterId || voterId === 'undefined') {
      res.status(400).json(ApiResponse.error('voterId is required', 400).body);
      return;
    }

    const removed = await mobileContactSyncService.removeSyncedContact(user, voterId);

    if (!removed) {
      res.status(404).json(ApiResponse.error('Synced contact record not found', 404).body);
      return;
    }

    const response = ApiResponse.success({ voterId }, 'Synced contact removed successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const mobileContactSyncController = new MobileContactSyncController();
