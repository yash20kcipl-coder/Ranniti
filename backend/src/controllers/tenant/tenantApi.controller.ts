import { ApiError } from '../../utils/apiError';
import { attachFileUrls } from '../../utils/fileUrl';
import { Request, Response, NextFunction } from 'express';
import { tenantApiService } from '../../services/tenant/tenantApi.service';

export class TenantApiController {
  private async resolveTenantDb(req: Request): Promise<string | null> {
    if (req.user?.tenantDbName) {
      return req.user.tenantDbName;
    }
    if (req.user?.userId) {
      const { query } = await import('../../queries/dbPool');
      const tRes = await query(`SELECT tenant_db_name FROM tenants WHERE id = $1 LIMIT 1`, [req.user.userId]);
      const dbName = tRes.rows[0]?.tenant_db_name || null;
      if (dbName && req.user) {
        req.user.tenantDbName = dbName;
      }
      return dbName;
    }
    return null;
  }

  // --- ACs ---
  getAcs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw ApiError.unauthorized('Authentication required');
      const tenantDbName = await this.resolveTenantDb(req);

      const params = {
        pcId: req.query.pcId as string | undefined,
        districtId: req.query.districtId as string | undefined,
        stateId: req.query.stateId as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };
      const result = await tenantApiService.getTenantAcs(userId, params, tenantDbName);
      if (typeof result === 'object' && 'acs' in result) {
        res.status(200).json({ success: true, data: result.acs, pagination: result.pagination });
      } else {
        res.status(200).json({ success: true, data: result });
      }
    } catch (error) {
      next(error);
    }
  };

  createAc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw ApiError.unauthorized('Authentication required');
      const tenantDbName = await this.resolveTenantDb(req);

      const newAc = await tenantApiService.createTenantAc(userId, req.body, tenantDbName);
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
      const tenantDbName = await this.resolveTenantDb(req);

      const params = {
        acId: req.query.acId as string | undefined,
        pcId: req.query.pcId as string | undefined,
        districtId: req.query.districtId as string | undefined,
        stateId: req.query.stateId as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };
      const result = await tenantApiService.getTenantWards(userId, params, tenantDbName);
      if (typeof result === 'object' && 'wards' in result) {
        res.status(200).json({ success: true, data: result.wards, pagination: result.pagination });
      } else {
        res.status(200).json({ success: true, data: result });
      }
    } catch (error) {
      next(error);
    }
  };

  createWard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const newWard = await tenantApiService.createTenantWard(req.body, tenantDbName);
      res.status(201).json({ success: true, data: newWard, message: 'Ward created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // --- BOOTHS ---
  getBoothOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw ApiError.unauthorized('Authentication required');
      const tenantDbName = await this.resolveTenantDb(req);

      const params = {
        acId: req.query.acId as string | undefined,
        wardId: req.query.wardId as string | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };
      const result = await tenantApiService.getTenantBoothOptions(userId, params, tenantDbName);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getBooths = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw ApiError.unauthorized('Authentication required');
      const tenantDbName = await this.resolveTenantDb(req);

      const params = {
        acId: req.query.acId as string | undefined,
        wardId: req.query.wardId as string | undefined,
        pcId: req.query.pcId as string | undefined,
        districtId: req.query.districtId as string | undefined,
        stateId: req.query.stateId as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };
      const result = await tenantApiService.getTenantBooths(userId, params, tenantDbName);
      if (typeof result === 'object' && 'booths' in result) {
        res.status(200).json({ success: true, data: result.booths, pagination: result.pagination });
      } else {
        res.status(200).json({ success: true, data: result });
      }
    } catch (error) {
      next(error);
    }
  };

  createBooth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw ApiError.unauthorized('Authentication required');
      const tenantDbName = await this.resolveTenantDb(req);

      const newBooth = await tenantApiService.createTenantBooth(userId, req.body, tenantDbName);
      res.status(201).json({ success: true, data: newBooth, message: 'Booth created and assigned successfully' });
    } catch (error) {
      next(error);
    }
  };

  // --- GEOGRAPHY ---
  getStates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const states = await tenantApiService.getTenantStates(tenantDbName);
      res.status(200).json({ success: true, data: states });
    } catch (error) {
      next(error);
    }
  };

  getPcs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const stateId = req.query.stateId as string | undefined;
      const pcs = await tenantApiService.getTenantPcs(stateId, tenantDbName, req.user?.userId);
      res.status(200).json({ success: true, data: pcs });
    } catch (error) {
      next(error);
    }
  };

  getDistricts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const stateId = req.query.stateId as string | undefined;
      const districts = await tenantApiService.getTenantDistricts(stateId, tenantDbName);
      res.status(200).json({ success: true, data: districts });
    } catch (error) {
      next(error);
    }
  };

  getTalukas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const districtId = req.query.districtId as string | undefined;
      const talukas = await tenantApiService.getTenantTalukas(districtId, tenantDbName);
      res.status(200).json({ success: true, data: talukas });
    } catch (error) {
      next(error);
    }
  };

  createTaluka = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const newTaluka = await tenantApiService.createTenantTaluka(req.body, tenantDbName);
      res.status(201).json({ success: true, data: newTaluka, message: 'Taluka created successfully' });
    } catch (error) {
      next(error);
    }
  };

  getVillages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const params = {
        talukaId: req.query.talukaId as string | undefined,
        districtId: req.query.districtId as string | undefined,
        stateId: req.query.stateId as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };
      const result = await tenantApiService.getTenantVillages(params, tenantDbName);
      if (typeof result === 'object' && 'villages' in result) {
        res.status(200).json({ success: true, data: result.villages, pagination: result.pagination });
      } else {
        res.status(200).json({ success: true, data: result });
      }
    } catch (error) {
      next(error);
    }
  };

  createVillage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const newVillage = await tenantApiService.createTenantVillage(req.body, tenantDbName);
      res.status(201).json({ success: true, data: newVillage, message: 'Village created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // --- REFERENCE MASTERS ---
  getReligions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const religions = await tenantApiService.getTenantReligions(tenantDbName);
      res.status(200).json({ success: true, data: religions });
    } catch (error) {
      next(error);
    }
  };

  getCastes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const religionId = req.query.religionId as string | undefined;
      const castes = await tenantApiService.getTenantCastes(religionId, tenantDbName);
      res.status(200).json({ success: true, data: castes });
    } catch (error) {
      next(error);
    }
  };

  createCaste = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const newCaste = await tenantApiService.createTenantCaste(req.body, tenantDbName);
      res.status(201).json({ success: true, data: newCaste, message: 'Caste created successfully' });
    } catch (error) {
      next(error);
    }
  };

  getParties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const parties = await tenantApiService.getTenantParties(tenantDbName);
      const partiesWithUrls = attachFileUrls(parties, ['symbolLogo'], req);
      res.status(200).json({ success: true, data: partiesWithUrls });
    } catch (error) {
      next(error);
    }
  };

  createParty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const newParty = await tenantApiService.createTenantParty(req.body, tenantDbName);
      const partyWithUrl = attachFileUrls(newParty, ['symbolLogo'], req);
      res.status(201).json({ success: true, data: partyWithUrl, message: 'Political party created successfully' });
    } catch (error) {
      next(error);
    }
  };

  updateAc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const id = String(req.params.id);
      const updated = await tenantApiService.updateTenantAc(id, req.body, tenantDbName);
      res.status(200).json({ success: true, data: updated, message: 'Assembly constituency updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  deleteAc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const id = String(req.params.id);
      await tenantApiService.deleteTenantAc(id, tenantDbName);
      res.status(200).json({ success: true, message: 'Assembly constituency deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  updateWard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const id = String(req.params.id);
      const updated = await tenantApiService.updateTenantWard(id, req.body, tenantDbName);
      res.status(200).json({ success: true, data: updated, message: 'Ward updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  deleteWard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const id = String(req.params.id);
      await tenantApiService.deleteTenantWard(id, tenantDbName);
      res.status(200).json({ success: true, message: 'Ward deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  updateBooth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const id = String(req.params.id);
      const updated = await tenantApiService.updateTenantBooth(id, req.body, tenantDbName);
      res.status(200).json({ success: true, data: updated, message: 'Booth updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  deleteBooth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantDbName = await this.resolveTenantDb(req);
      const id = String(req.params.id);
      await tenantApiService.deleteTenantBooth(id, tenantDbName);
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
      const tenantDbName = await this.resolveTenantDb(req);

      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = req.query.search as string | undefined;
      const boothId = req.query.boothId as string | undefined;
      const acId = req.query.acId as string | undefined;

      const result = await tenantApiService.getTenantVoters(userId, { page, limit, search, boothId, acId }, tenantDbName);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };
}

export const tenantApiController = new TenantApiController();
