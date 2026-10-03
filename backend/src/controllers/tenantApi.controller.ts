import { Request, Response, NextFunction } from 'express';
import { tenantApiService } from '../services/tenantApi.service';
import { ApiError } from '../utils/apiError';
import { attachFileUrls } from '../utils/fileUrl';

export class TenantApiController {
  // --- ACs ---
  getAcs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw ApiError.unauthorized('Authentication required');

      const acs = await tenantApiService.getTenantAcs(userId);
      res.status(200).json({ success: true, data: acs });
    } catch (error) {
      next(error);
    }
  };

  createAc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw ApiError.unauthorized('Authentication required');

      const newAc = await tenantApiService.createTenantAc(userId, req.body);
      res.status(201).json({ success: true, data: newAc, message: 'Assembly constituency created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // --- WARDS ---
  getWards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw ApiError.unauthorized('Authentication required');

      const acId = req.query.acId as string | undefined;
      const wards = await tenantApiService.getTenantWards(userId, acId);
      res.status(200).json({ success: true, data: wards });
    } catch (error) {
      next(error);
    }
  };

  createWard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const newWard = await tenantApiService.createTenantWard(req.body);
      res.status(201).json({ success: true, data: newWard, message: 'Ward created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // --- BOOTHS ---
  getBooths = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw ApiError.unauthorized('Authentication required');

      const acId = req.query.acId as string | undefined;
      const wardId = req.query.wardId as string | undefined;
      const booths = await tenantApiService.getTenantBooths(userId, acId, wardId);
      res.status(200).json({ success: true, data: booths });
    } catch (error) {
      next(error);
    }
  };

  createBooth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw ApiError.unauthorized('Authentication required');

      const newBooth = await tenantApiService.createTenantBooth(userId, req.body);
      res.status(201).json({ success: true, data: newBooth, message: 'Booth created and assigned successfully' });
    } catch (error) {
      next(error);
    }
  };

  // --- GEOGRAPHY ---
  getStates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const states = await tenantApiService.getTenantStates();
      res.status(200).json({ success: true, data: states });
    } catch (error) {
      next(error);
    }
  };

  getDistricts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stateId = req.query.stateId as string | undefined;
      const districts = await tenantApiService.getTenantDistricts(stateId);
      res.status(200).json({ success: true, data: districts });
    } catch (error) {
      next(error);
    }
  };

  getTalukas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const districtId = req.query.districtId as string | undefined;
      const talukas = await tenantApiService.getTenantTalukas(districtId);
      res.status(200).json({ success: true, data: talukas });
    } catch (error) {
      next(error);
    }
  };

  createTaluka = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const newTaluka = await tenantApiService.createTenantTaluka(req.body);
      res.status(201).json({ success: true, data: newTaluka, message: 'Taluka created successfully' });
    } catch (error) {
      next(error);
    }
  };

  getVillages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const talukaId = req.query.talukaId as string | undefined;
      const villages = await tenantApiService.getTenantVillages(talukaId);
      res.status(200).json({ success: true, data: villages });
    } catch (error) {
      next(error);
    }
  };

  createVillage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const newVillage = await tenantApiService.createTenantVillage(req.body);
      res.status(201).json({ success: true, data: newVillage, message: 'Village created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // --- REFERENCE MASTERS ---
  getReligions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const religions = await tenantApiService.getTenantReligions();
      res.status(200).json({ success: true, data: religions });
    } catch (error) {
      next(error);
    }
  };

  getCastes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const religionId = req.query.religionId as string | undefined;
      const castes = await tenantApiService.getTenantCastes(religionId);
      res.status(200).json({ success: true, data: castes });
    } catch (error) {
      next(error);
    }
  };

  createCaste = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const newCaste = await tenantApiService.createTenantCaste(req.body);
      res.status(201).json({ success: true, data: newCaste, message: 'Caste created successfully' });
    } catch (error) {
      next(error);
    }
  };

  getParties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parties = await tenantApiService.getTenantParties();
      const partiesWithUrls = attachFileUrls(parties, ['symbolLogo'], req);
      res.status(200).json({ success: true, data: partiesWithUrls });
    } catch (error) {
      next(error);
    }
  };

  createParty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const newParty = await tenantApiService.createTenantParty(req.body);
      const partyWithUrl = attachFileUrls(newParty, ['symbolLogo'], req);
      res.status(201).json({ success: true, data: partyWithUrl, message: 'Political party created successfully' });
    } catch (error) {
      next(error);
    }
  };

  updateAc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const updated = await tenantApiService.updateTenantAc(id, req.body);
      res.status(200).json({ success: true, data: updated, message: 'Assembly constituency updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  deleteAc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      await tenantApiService.deleteTenantAc(id);
      res.status(200).json({ success: true, message: 'Assembly constituency deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  updateWard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const updated = await tenantApiService.updateTenantWard(id, req.body);
      res.status(200).json({ success: true, data: updated, message: 'Ward updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  deleteWard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      await tenantApiService.deleteTenantWard(id);
      res.status(200).json({ success: true, message: 'Ward deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  updateBooth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const updated = await tenantApiService.updateTenantBooth(id, req.body);
      res.status(200).json({ success: true, data: updated, message: 'Booth updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  deleteBooth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      await tenantApiService.deleteTenantBooth(id);
      res.status(200).json({ success: true, message: 'Booth deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // --- VOTERS ---
  getVoters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw ApiError.unauthorized('Authentication required');

      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = req.query.search as string | undefined;
      const boothId = req.query.boothId as string | undefined;
      const acId = req.query.acId as string | undefined;

      const result = await tenantApiService.getTenantVoters(userId, { page, limit, search, boothId, acId });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };
}

export const tenantApiController = new TenantApiController();
