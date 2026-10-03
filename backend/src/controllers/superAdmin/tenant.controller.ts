import { Request, Response, NextFunction } from 'express';
import { SuperAdminTenantService } from '../../services/superAdmin/tenant.service';

export class SuperAdminTenantController {
  static async getAllTenants(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenants = await SuperAdminTenantService.getAllTenants();
      res.json({ success: true, data: tenants });
    } catch (err) {
      next(err);
    }
  }

  static async getTenantStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const status = await SuperAdminTenantService.getTenantStatus(userId);
      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  }
}
