import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { attachFileUrls, toFileUrl } from '../../utils/fileUrl';
import { settingsQueries } from '../../queries/settings.queries';
import { SyncManifestService } from '../../services/syncManifest.service';

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

  /**
   * GET /api/v1/tenant/settings/whatsapp/templates
   * List Tenant WhatsApp Templates from Tenant DB
   */
  getTenantWhatsAppTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || req.user?.tenantDbName;
    const { category, status, search } = req.query;

    const templates = await settingsQueries.getWhatsAppTemplates(
      {
        category: category as string,
        status: status as string,
        search: search as string,
      },
      tenantDbName
    );

    const payload = formatTemplatePayload(templates, req);
    const response = ApiResponse.success(payload, 'Tenant WhatsApp templates retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/tenant/settings/whatsapp/templates/:id
   * Get single Tenant WhatsApp Template by ID
   */
  getTenantWhatsAppTemplateById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || req.user?.tenantDbName;
    const id = req.params.id as string;

    const template = await settingsQueries.getWhatsAppTemplateById(id, tenantDbName);
    if (!template) {
      throw ApiError.notFound('WhatsApp template not found');
    }

    const payload = formatTemplatePayload(template, req);
    const response = ApiResponse.success(payload, 'Tenant WhatsApp template retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/tenant/settings/whatsapp/templates
   * Create new Tenant WhatsApp Template in Tenant DB
   */
  createTenantWhatsAppTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || req.user?.tenantDbName;
    const { name, category, language, headerType, headerContent, bodyText, footerText, buttons, variables } = req.body;

    if (!name || !bodyText) {
      throw ApiError.badRequest('Template name and body text are required');
    }

    const created = await settingsQueries.createWhatsAppTemplate(
      {
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
      },
      tenantDbName
    );

    const payload = formatTemplatePayload(created, req);
    const response = ApiResponse.success(payload, 'Tenant WhatsApp template created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  /**
   * PUT /api/v1/tenant/settings/whatsapp/templates/:id
   * Update Tenant WhatsApp Template in Tenant DB
   */
  updateTenantWhatsAppTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || req.user?.tenantDbName;
    const id = req.params.id as string;

    const updated = await settingsQueries.updateWhatsAppTemplate(id, req.body, tenantDbName);
    if (!updated) {
      throw ApiError.notFound('WhatsApp template not found');
    }

    const payload = formatTemplatePayload(updated, req);
    const response = ApiResponse.success(payload, 'Tenant WhatsApp template updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * DELETE /api/v1/tenant/settings/whatsapp/templates/:id
   * Delete Tenant WhatsApp Template from Tenant DB
   */
  deleteTenantWhatsAppTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || req.user?.tenantDbName;
    const id = req.params.id as string;

    const success = await settingsQueries.deleteWhatsAppTemplate(id, tenantDbName);
    if (!success) {
      throw ApiError.notFound('WhatsApp template not found');
    }

    const response = ApiResponse.success({ id }, 'Tenant WhatsApp template deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/tenant/settings/whatsapp/templates/sync
   * Reset / sync Tenant WhatsApp Templates from default catalog
   */
  syncTenantWhatsAppTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || req.user?.tenantDbName;
    const { seedSettings } = await import('../../seeds/seeders/setting.seeder');
    if (tenantDbName) {
      await seedSettings(tenantDbName);
    }
    const templates = await settingsQueries.getWhatsAppTemplates({}, tenantDbName);
    const payload = formatTemplatePayload(templates, req);
    const response = ApiResponse.success(payload, 'Tenant WhatsApp templates synchronized');
    res.status(response.statusCode).json(response.body);
  });
}

export const tenantSettingsController = new TenantSettingsController();
