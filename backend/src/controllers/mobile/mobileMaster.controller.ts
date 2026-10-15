import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { attachFileUrls } from '../../utils/fileUrl';
import { tenantApiService } from '../../services/tenant/tenantApi.service';

export class MobileMasterController {
  getAcs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const params = {
      pcId: req.query.pcId as string | undefined,
      districtId: req.query.districtId as string | undefined,
      stateId: req.query.stateId as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };

    const result = await tenantApiService.getTenantAcs(user.id, params, user.tenantDbName);
    const data = typeof result === 'object' && 'acs' in result ? (result as any).acs : result;
    const response = ApiResponse.success(data, 'Assembly constituencies retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getWards = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const params = {
      acId: (req.query.acId as string | undefined) || user.assignedAcId || undefined,
      pcId: req.query.pcId as string | undefined,
      districtId: req.query.districtId as string | undefined,
      stateId: req.query.stateId as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };

    const result = await tenantApiService.getTenantWards(user.id, params, user.tenantDbName);
    const data = typeof result === 'object' && 'wards' in result ? (result as any).wards : result;
    const response = ApiResponse.success(data, 'Wards retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getBoothOptions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const params = {
      acId: (req.query.acId as string | undefined) || user.assignedAcId || undefined,
      wardId: req.query.wardId as string | undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };

    const result = await tenantApiService.getTenantBoothOptions(user.id, params, user.tenantDbName);
    const response = ApiResponse.success(result, 'Booth options retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getParties = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const parties = await tenantApiService.getTenantParties(user.tenantDbName);
    const formatted = attachFileUrls(parties, ['symbolLogo'], req);
    const response = ApiResponse.success(formatted, 'Parties retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getReligions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const religions = await tenantApiService.getTenantReligions(user.tenantDbName);
    const response = ApiResponse.success(religions, 'Religions retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getCastes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const religionId = req.query.religionId as string | undefined;
    const castes = await tenantApiService.getTenantCastes(religionId, user.tenantDbName);
    const response = ApiResponse.success(castes, 'Castes retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getStates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const states = await tenantApiService.getTenantStates(user.tenantDbName);
    const response = ApiResponse.success(states, 'States retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getPcs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const stateId = req.query.stateId as string | undefined;
    const pcs = await tenantApiService.getTenantPcs(stateId, user.tenantDbName, user.id);
    const response = ApiResponse.success(pcs, 'Parliamentary constituencies retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getDistricts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const stateId = req.query.stateId as string | undefined;
    const districts = await tenantApiService.getTenantDistricts(stateId, user.tenantDbName);
    const response = ApiResponse.success(districts, 'Districts retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getTalukas = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const districtId = req.query.districtId as string | undefined;
    const talukas = await tenantApiService.getTenantTalukas(districtId, user.tenantDbName);
    const response = ApiResponse.success(talukas, 'Talukas retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getVillages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const params = {
      talukaId: req.query.talukaId as string | undefined,
      districtId: req.query.districtId as string | undefined,
      stateId: req.query.stateId as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };
    const result = await tenantApiService.getTenantVillages(params, user.tenantDbName);
    const data = typeof result === 'object' && 'villages' in result ? (result as any).villages : result;
    const response = ApiResponse.success(data, 'Villages retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const mobileMasterController = new MobileMasterController();
