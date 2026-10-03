import { Request, Response, NextFunction } from 'express';
import { VolunteerAssignedBoothService, VolunteerVoterSurveyService } from '../../services/volunteer';
import { ApiError } from '../../utils/apiError';

export class VolunteerSurveyController {
  // Assigned Booths
  static async getAssignedBooths(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.tenantPool) return next(ApiError.internal('Tenant DB pool unattached'));
      const booths = await VolunteerAssignedBoothService.getAssignedBooths(
        req.tenantPool,
        req.assignedBoothIds || []
      );
      res.json({ success: true, data: booths });
    } catch (err) {
      next(err);
    }
  }

  // Scoped Voters
  static async getScopedVoters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.tenantPool) return next(ApiError.internal('Tenant DB pool unattached'));
      const limit = parseInt(req.query.limit as string || '50', 10);
      const offset = parseInt(req.query.offset as string || '0', 10);

      const { voters, total } = await VolunteerVoterSurveyService.getScopedVoters(
        req.tenantPool,
        req.assignedBoothIds || [],
        limit,
        offset
      );

      res.json({ success: true, data: voters, total });
    } catch (err) {
      next(err);
    }
  }

  // Update Voter Survey
  static async updateVoterSurvey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.tenantPool) return next(ApiError.internal('Tenant DB pool unattached'));
      const voterId = req.params.voterId as string;
      const updated = await VolunteerVoterSurveyService.updateVoterSurvey(
        req.tenantPool,
        req.assignedBoothIds || [],
        voterId,
        req.body
      );

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

}
