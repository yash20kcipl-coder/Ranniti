import { Request, Response } from 'express';
import { attachFileUrls } from '../../utils/fileUrl';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { FamilyMappingService } from '../../services/tenant/familyMapping.service';

export class MobileFamilyMappingController {
  getFamilies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const tenantDbName = user.tenantDbName || undefined;
    const query = req.query;

    const page = query.page ? parseInt(query.page as string, 10) : 1;
    const limit = query.limit ? parseInt(query.limit as string, 10) : 25;
    const search = query.search as string | undefined;

    let parsedBoothIds: string[] = [];
    if (query.boothIds) {
      if (Array.isArray(query.boothIds)) {
        parsedBoothIds = query.boothIds.map(String);
      } else if (typeof query.boothIds === 'string') {
        parsedBoothIds = (query.boothIds as string).split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    if (query.boothId && query.boothId !== 'All' && query.boothId !== 'all') {
      const singleId = String(query.boothId).trim();
      if (!parsedBoothIds.includes(singleId)) {
        parsedBoothIds.push(singleId);
      }
    }

    const assignedBoothIds = user.assignedBoothIds;
    if (assignedBoothIds && assignedBoothIds.length > 0) {
      if (parsedBoothIds.length > 0) {
        parsedBoothIds = parsedBoothIds.filter((id) => assignedBoothIds.includes(id));
        if (parsedBoothIds.length === 0) {
          res.status(403).json(ApiResponse.error('Access denied to requested booth(s)', 403).body);
          return;
        }
      } else {
        parsedBoothIds = assignedBoothIds;
      }
    }

    const result = await FamilyMappingService.getFamiliesList({
      tenantDbName,
      boothIds: parsedBoothIds.length > 0 ? parsedBoothIds : undefined,
      search,
      page,
      limit,
    });

    const formattedData = attachFileUrls(result.data, ['headAvatar', 'headPartySymbol'], req);

    // Fetch members for each family and map to app's FamilyGroup structure
    const mappedFamilies = await Promise.all(formattedData.map(async (fam: any) => {
      const membersRes = await FamilyMappingService.getFamilyMembers(tenantDbName, fam.headId);

      const allMembers = [membersRes.head, ...membersRes.members].map(m => ({
        id: m.id,
        name: m.name,
        relation: m.familyRelation || (m.id === fam.headId ? 'Head' : 'Member'),
        age: m.age || 0,
        gender: m.gender || '',
        epicNo: m.epicNo || '',
        mobile: m.mobileNo || '',
        isVoted: m.status === 'voted',
        supportingParty: m.partyName || 'Unknown',
      }));

      return {
        familyId: fam.familyId || fam.headId,
        headName: fam.headLocalName || fam.headName || '',
        headMobile: fam.headMobileNo || '',
        headEpic: fam.headEpicNo || '',
        headPhoto: fam.headAvatar || '',
        address: fam.voterAddress || fam.houseNo || '',
        totalMembers: fam.totalMembers || allMembers.length,
        members: allMembers,
      };
    }));

    const response = ApiResponse.success(
      {
        families: mappedFamilies,
        pagination: {
          total: result.total,
          totalMembers: result.totalMembers,
          votedMembers: result.votedMembers,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      },
      'Families retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  getFamilyMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const headId = req.params.headId as string;
    const tenantDbName = req.mobileUser?.tenantDbName || (req.user as any)?.tenantDbName;
    const result = await FamilyMappingService.getFamilyMembers(tenantDbName, headId);

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
}

export const mobileFamilyMappingController = new MobileFamilyMappingController();
