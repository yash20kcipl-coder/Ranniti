import { Request, Response } from 'express';
import { attachFileUrls } from '../../utils/fileUrl';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { FamilyMappingService } from '../../services/tenant/familyMapping.service';

export class FamilyMappingController {
  /**
   * Auto-map voters in a booth into family units
   */
  static autoMapFamilies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { boothId, dryRun = false } = req.body;

    if (!boothId) {
      const errRes = ApiResponse.error('boothId is required for family auto-mapping', 400);
      res.status(errRes.statusCode).json(errRes.body);
      return;
    }

    const result = await FamilyMappingService.autoMapBoothFamilies({
      boothId,
      dryRun: Boolean(dryRun),
    });

    const response = ApiResponse.success(
      result,
      dryRun
        ? 'Family auto-mapping preview calculated successfully'
        : 'Families successfully auto-mapped and updated in the database'
    );
    res.status(response.statusCode).json(response.body);
  });

  /**
   * Get paginated families list
   */
  static getFamilies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const boothId = req.query.boothId as string | undefined;
    const search = req.query.search as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const minMembers = req.query.minMembers ? parseInt(req.query.minMembers as string, 10) : undefined;

    const result = await FamilyMappingService.getFamiliesList({
      boothId,
      search,
      page,
      limit,
      minMembers,
    });

    // Rule 1: attachFileUrls for any avatar or symbols
    const formattedData = attachFileUrls(result.data, ['headAvatar', 'headPartySymbol'], req);

    const response = ApiResponse.success(
      {
        families: formattedData,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      },
      'Families retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  /**
   * Get family members under a specific Head of Family
   */
  static getFamilyMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const headId = req.params.headId as string;

    const result = await FamilyMappingService.getFamilyMembers(headId);

    const formattedHead = attachFileUrls(result.head, ['avatar', 'partySymbol'], req);
    const formattedMembers = attachFileUrls(result.members, ['avatar', 'partySymbol'], req);

    const response = ApiResponse.success(
      {
        head: formattedHead,
        members: formattedMembers,
        summary: result.summary,
      },
      'Family details retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });


  /**
   * Transfer Head of Family role to another member
   */
  static setNewFamilyHead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { currentHeadId, newHeadId } = req.body;

    if (!currentHeadId || !newHeadId) {
      const errRes = ApiResponse.error('Both currentHeadId and newHeadId are required', 400);
      res.status(errRes.statusCode).json(errRes.body);
      return;
    }

    await FamilyMappingService.setNewFamilyHead(currentHeadId, newHeadId);
    const response = ApiResponse.success(null, 'Family head role successfully reassigned');
    res.status(response.statusCode).json(response.body);
  });
}
