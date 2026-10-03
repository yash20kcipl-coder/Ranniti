import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { attachFileUrls, toFileUrl } from '../../utils/fileUrl';
import { settingsQueries } from '../../queries/settings.queries';

const formatTemplatePayload = (item: any, req: Request): any => {
  if (!item) return item;
  if (Array.isArray(item)) {
    return item.map((i) => formatTemplatePayload(i, req));
  }
  const copy = { ...item };
  if (
    (copy.headerType === 'IMAGE' || copy.headerType === 'DOCUMENT' || copy.headerType === 'VIDEO') &&
    copy.headerContent
  ) {
    copy.headerContent = toFileUrl(copy.headerContent, req);
  }
  if (typeof copy.bodyText === 'string') {
    copy.bodyText = copy.bodyText.replace(/\\n/g, '\n');
  }
  return copy;
};

export class TenantSettingsController {
  /**
   * GET /api/v1/tenant/settings
   * Retrieve Tenant Settings from Tenant DB
   */
  getTenantSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const settings = await settingsQueries.getSettings();

    const safeSettings = {
      ...settings,
      fcmPrivateKey: settings.fcmPrivateKey ? '••••••••••••••••••••' : null,
      fcmServerKey: settings.fcmServerKey ? '••••••••••••••••••••' : null,
      apnsAuthKey: settings.apnsAuthKey ? '••••••••••••••••••••' : null,
      whatsappAccessToken: settings.whatsappAccessToken ? '••••••••••••••••••••' : null,
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
    const response = ApiResponse.success(payload, 'Tenant settings updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/tenant/whatsapp/templates
   * List Tenant WhatsApp Templates from Tenant DB
   */
  getTenantWhatsAppTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { category, status, search } = req.query;

    const templates = await settingsQueries.getWhatsAppTemplates({
      category: category as string,
      status: status as string,
      search: search as string,
    });

    const payload = formatTemplatePayload(templates, req);
    const response = ApiResponse.success(payload, 'Tenant WhatsApp templates retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/tenant/whatsapp/templates
   * Create Tenant WhatsApp Template in Tenant DB
   */
  createTenantWhatsAppTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, category, language, headerType, headerContent, bodyText, footerText, buttons, variables } = req.body;

    if (!name || !bodyText) {
      throw ApiError.badRequest('Template name and body text are required');
    }

    const created = await settingsQueries.createWhatsAppTemplate({
      name,
      category,
      language,
      headerType,
      headerContent,
      bodyText,
      footerText,
      buttons,
      variables,
      metaStatus: 'APPROVED',
    });

    const payload = formatTemplatePayload(created, req);
    const response = ApiResponse.success(payload, 'Tenant WhatsApp template created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  /**
   * PUT /api/v1/tenant/whatsapp/templates/:id
   * Update Tenant WhatsApp Template
   */
  updateTenantWhatsAppTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const updated = await settingsQueries.updateWhatsAppTemplate(id, req.body);

    if (!updated) {
      throw ApiError.notFound('WhatsApp template not found');
    }

    const payload = formatTemplatePayload(updated, req);
    const response = ApiResponse.success(payload, 'Tenant WhatsApp template updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * DELETE /api/v1/tenant/whatsapp/templates/:id
   * Delete Tenant WhatsApp Template
   */
  deleteTenantWhatsAppTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const success = await settingsQueries.deleteWhatsAppTemplate(id);

    if (!success) {
      throw ApiError.notFound('WhatsApp template not found');
    }

    const response = ApiResponse.success({ id }, 'Tenant WhatsApp template deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/tenant/whatsapp/templates/sync
   * Sync Tenant WhatsApp Templates from Meta
   */
  syncTenantWhatsAppTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshed = await settingsQueries.syncMetaTemplateStatuses();
    const payload = formatTemplatePayload(refreshed, req);
    const response = ApiResponse.success(payload, 'Tenant WhatsApp templates synchronized with Meta');
    res.status(response.statusCode).json(response.body);
  });
}

export const tenantSettingsController = new TenantSettingsController();
