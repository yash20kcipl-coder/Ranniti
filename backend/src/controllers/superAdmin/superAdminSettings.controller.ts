import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { attachFileUrls } from '../../utils/fileUrl';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { settingsQueries } from '../../queries/settings.queries';

export class SuperAdminSettingsController {
  /**
   * GET /api/v1/super-admin/settings
   * Retrieve Super Admin Master Campaign & System Settings
   */
  getSuperAdminSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const settings = await settingsQueries.getSettings();

    const safeSettings = {
      ...settings,
      fcmPrivateKey: settings.fcmPrivateKey ? '••••••••••••••••••••' : null,
      fcmServerKey: settings.fcmServerKey ? '••••••••••••••••••••' : null,
      apnsAuthKey: settings.apnsAuthKey ? '••••••••••••••••••••' : null,
      whatsappAccessToken: settings.whatsappAccessToken ? '••••••••••••••••••••' : null,
    };

    const payload = attachFileUrls(safeSettings, ['partySymbolUrl', 'candidatePhotoUrl'], req);
    const response = ApiResponse.success(payload, 'Super Admin master settings retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * PUT /api/v1/super-admin/settings
   * Update Super Admin Master Campaign & System Settings in Master DB
   */
  updateSuperAdminSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = req.body;

    if (data.fcmPrivateKey && data.fcmPrivateKey.includes('•••')) delete data.fcmPrivateKey;
    if (data.fcmServerKey && data.fcmServerKey.includes('•••')) delete data.fcmServerKey;
    if (data.apnsAuthKey && data.apnsAuthKey.includes('•••')) delete data.apnsAuthKey;
    if (data.whatsappAccessToken && data.whatsappAccessToken.includes('•••')) delete data.whatsappAccessToken;

    const updated = await settingsQueries.upsertSettings(data);
    const safeUpdated = {
      ...updated,
      fcmPrivateKey: updated.fcmPrivateKey ? '••••••••••••••••••••' : null,
      fcmServerKey: updated.fcmServerKey ? '••••••••••••••••••••' : null,
      apnsAuthKey: updated.apnsAuthKey ? '••••••••••••••••••••' : null,
      whatsappAccessToken: updated.whatsappAccessToken ? '••••••••••••••••••••' : null,
    };

    const payload = attachFileUrls(safeUpdated, ['partySymbolUrl', 'candidatePhotoUrl'], req);
    const response = ApiResponse.success(payload, 'Super Admin master settings updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/super-admin/settings/survey-field-points
   * Retrieve platform master survey field scoring points
   */
  getSurveyFieldPoints = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const points = await settingsQueries.getSurveyFieldPoints(null);
    const response = ApiResponse.success(points, 'Master survey field points retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * PUT /api/v1/super-admin/settings/survey-field-points
   * Update platform master survey field scoring points
   */
  updateSurveyFieldPoints = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pointsConfig = req.body;
    if (!pointsConfig || typeof pointsConfig !== 'object') {
      throw ApiError.badRequest('Invalid points configuration payload');
    }
    const updated = await settingsQueries.updateSurveyFieldPoints(pointsConfig, null);
    await settingsQueries.syncSurveyFieldPointsToAllTenants(updated);
    const response = ApiResponse.success(updated, 'Master survey field points updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/super-admin/settings/survey-field-points/reset
   * Reset platform master survey field scoring points to default configuration
   */
  resetSurveyFieldPoints = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reset = await settingsQueries.resetSurveyFieldPoints(null);
    await settingsQueries.syncSurveyFieldPointsToAllTenants(reset);
    const response = ApiResponse.success(reset, 'Master survey field points reset to defaults successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const superAdminSettingsController = new SuperAdminSettingsController();

