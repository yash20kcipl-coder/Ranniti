import { Request, Response } from 'express';
import { attachFileUrls } from '../../utils/fileUrl';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { settingsQueries } from '../../queries/settings.queries';
import { SyncManifestService } from '../../services/syncManifest.service';

export class TenantSettingsController {
  /**
   * GET /api/v1/tenant/settings
   * Retrieve Tenant Settings from Tenant DB or Redis
   */
  getTenantSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || req.user?.tenantDbName;
    const settings = await settingsQueries.getSettings(tenantDbName);

    const safeSettings = {
      ...settings,
      fcmPrivateKey: settings.fcmPrivateKey ? '••••••••••••••••••••' : null,
      fcmServerKey: settings.fcmServerKey ? '••••••••••••••••••••' : null,
      apnsAuthKey: settings.apnsAuthKey ? '••••••••••••••••••••' : null,
    };

    const payload = attachFileUrls(safeSettings, ['partySymbolUrl', 'candidatePhotoUrl'], req);
    const response = ApiResponse.success(payload, 'Tenant settings retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * PUT /api/v1/tenant/settings
   * Update Tenant Settings in Tenant DB
   */
  updateTenantSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || req.user?.tenantDbName;
    const data = req.body;

    if (data.fcmPrivateKey && data.fcmPrivateKey.includes('•••')) delete data.fcmPrivateKey;
    if (data.fcmServerKey && data.fcmServerKey.includes('•••')) delete data.fcmServerKey;
    if (data.apnsAuthKey && data.apnsAuthKey.includes('•••')) delete data.apnsAuthKey;

    const updated = await settingsQueries.upsertSettings(data, tenantDbName);
    await SyncManifestService.bumpVersion('tenantSettings', (req.user as any)?.tenantId || req.user?.tenantDbName || undefined);

    const safeUpdated = {
      ...updated,
      fcmPrivateKey: updated.fcmPrivateKey ? '••••••••••••••••••••' : null,
      fcmServerKey: updated.fcmServerKey ? '••••••••••••••••••••' : null,
      apnsAuthKey: updated.apnsAuthKey ? '••••••••••••••••••••' : null,
    };

    const payload = attachFileUrls(safeUpdated, ['partySymbolUrl', 'candidatePhotoUrl'], req);
    const response = ApiResponse.success(payload, 'Tenant settings updated successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const tenantSettingsController = new TenantSettingsController();
