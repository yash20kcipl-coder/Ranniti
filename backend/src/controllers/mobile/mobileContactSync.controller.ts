import { Request, Response } from 'express';
import { attachFileUrls } from '../../utils/fileUrl';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { mobileAuthService } from '../../services/mobileAuth.service';
import { mobileContactSyncService } from '../../services/mobile/mobileContactSync.service';

export class MobileContactSyncController {
  syncContacts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const user = await mobileAuthService.getMobileProfile(userId);
    const { phoneNumbers = [], emails = [] } = req.body;

    if (!Array.isArray(phoneNumbers)) {
      res.status(400).json(ApiResponse.error('phoneNumbers must be an array of phone numbers', 400).body);
      return;
    }

    const result = await mobileContactSyncService.syncContacts(user, phoneNumbers, emails);
    const formattedVoters = result.matchedVoters.map(voter => attachFileUrls(voter, undefined, req));

    const response = ApiResponse.success(
      {
        totalMatched: result.totalMatched,
        matchedVoters: formattedVoters,
      },
      'Contact list synchronized successfully'
    );
    res.status(response.statusCode).json(response.body);
  });
}

export const mobileContactSyncController = new MobileContactSyncController();
