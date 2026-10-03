import { Request, Response, NextFunction } from 'express';
import { SuperAdminCasteService, SuperAdminReligionService, SuperAdminPartyService } from '../../services/superAdmin';
import { AuditLoggerService } from '../../services/audit/auditLogger.service';

export class SuperAdminMasterController {
  // Castes
  static async getCastes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const castes = await SuperAdminCasteService.getAllCastes();
      res.json({ success: true, data: castes });
    } catch (err) {
      next(err);
    }
  }

  static async createCaste(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const caste = await SuperAdminCasteService.createCaste(req.body);
      AuditLoggerService.log({
        userId: req.user?.userId,
        action: 'CREATE_CASTE',
        entityType: 'caste',
        entityId: caste.id,
        details: req.body,
        ipAddress: req.ip,
      });
      res.status(201).json({ success: true, data: caste });
    } catch (err) {
      next(err);
    }
  }

  // Religions
  static async getReligions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const religions = await SuperAdminReligionService.getAllReligions();
      res.json({ success: true, data: religions });
    } catch (err) {
      next(err);
    }
  }

  static async createReligion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const religion = await SuperAdminReligionService.createReligion(req.body);
      AuditLoggerService.log({
        userId: req.user?.userId,
        action: 'CREATE_RELIGION',
        entityType: 'religion',
        entityId: religion.id,
        details: req.body,
        ipAddress: req.ip,
      });
      res.status(201).json({ success: true, data: religion });
    } catch (err) {
      next(err);
    }
  }

  // Parties
  static async getParties(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parties = await SuperAdminPartyService.getAllParties();
      res.json({ success: true, data: parties });
    } catch (err) {
      next(err);
    }
  }

  static async createParty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const party = await SuperAdminPartyService.createParty(req.body);
      AuditLoggerService.log({
        userId: req.user?.userId,
        action: 'CREATE_PARTY',
        entityType: 'party',
        entityId: party.id,
        details: req.body,
        ipAddress: req.ip,
      });
      res.status(201).json({ success: true, data: party });
    } catch (err) {
      next(err);
    }
  }
}
