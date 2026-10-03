import { Request, Response, NextFunction } from 'express';
import { TenantAcService, TenantWardService, TenantBoothService } from '../../services/tenant';
import { ApiError } from '../../utils/apiError';

export class TenantGeographyController {
  // ACs
  static async getAcs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.tenantPool) return next(ApiError.internal('Tenant DB pool unattached'));
      const acs = await TenantAcService.getTenantAcs(req.tenantPool);
      res.json({ success: true, data: acs });
    } catch (err) {
      next(err);
    }
  }

  static async createAc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.tenantPool) return next(ApiError.internal('Tenant DB pool unattached'));
      const created = await TenantAcService.createTenantAc(req.tenantPool, req.body);
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }

  // Wards
  static async getWards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.tenantPool) return next(ApiError.internal('Tenant DB pool unattached'));
      const acId = req.query.acId as string;
      const wards = await TenantWardService.getTenantWards(req.tenantPool, acId);
      res.json({ success: true, data: wards });
    } catch (err) {
      next(err);
    }
  }

  static async createWard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.tenantPool) return next(ApiError.internal('Tenant DB pool unattached'));
      const created = await TenantWardService.createTenantWard(req.tenantPool, req.body);
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }

  // Booths
  static async getBooths(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.tenantPool) return next(ApiError.internal('Tenant DB pool unattached'));
      const acId = req.query.acId as string;
      const wardId = req.query.wardId as string;
      const booths = await TenantBoothService.getTenantBooths(req.tenantPool, acId, wardId);
      res.json({ success: true, data: booths });
    } catch (err) {
      next(err);
    }
  }

  static async createBooth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.tenantPool) return next(ApiError.internal('Tenant DB pool unattached'));
      const created = await TenantBoothService.createTenantBooth(req.tenantPool, req.body);
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }
}
