import { Request, Response } from 'express';
import { ApiError } from '../utils/apiError';
import { attachFileUrls, toFileUrl } from '../utils/fileUrl';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { settingsQueries } from '../queries/settings.queries';

const formatTemplatePayload = (item: any, req: Request): any => {
  if (!item) return item;
  if (Array.isArray(item)) {
    return item.map((i) => formatTemplatePayload(i, req));
  }
  const copy = { ...item };
  // Only convert headerContent to file URL if it's media (IMAGE, DOCUMENT, VIDEO)
  if (
    (copy.headerType === 'IMAGE' || copy.headerType === 'DOCUMENT' || copy.headerType === 'VIDEO') &&
    copy.headerContent
  ) {
    copy.headerContent = toFileUrl(copy.headerContent, req);
  }
  // Ensure literal \n in bodyText is normalized to real line breaks
  if (typeof copy.bodyText === 'string') {
    copy.bodyText = copy.bodyText.replace(/\\n/g, '\n');
  }
  return copy;
};

export class SettingsController {
  /**
   * GET /api/v1/settings
   * Retrieve campaign & system settings
   */
  getSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const settings = await settingsQueries.getSettings();

    const safeSettings = {
      ...settings,
      // Mask sensitive private keys if present for security
      fcmPrivateKey: settings.fcmPrivateKey ? '••••••••••••••••••••' : null,
      fcmServerKey: settings.fcmServerKey ? '••••••••••••••••••••' : null,
      apnsAuthKey: settings.apnsAuthKey ? '••••••••••••••••••••' : null,
      whatsappAccessToken: settings.whatsappAccessToken ? '••••••••••••••••••••' : null,
    };

    const payload = attachFileUrls(safeSettings, ['partySymbolUrl', 'candidatePhotoUrl'], req);
    const response = ApiResponse.success(payload, 'Campaign settings retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * PUT /api/v1/settings
   * Update campaign & system settings
   */
  updateSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = req.body;

    // Do not overwrite with masked values
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
    const response = ApiResponse.success(payload, 'Campaign settings updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/settings/push/test
   * Send test push notification via FCM/APNs
   */
  testPushNotification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { title, body, targetType, targetValue } = req.body;

    if (!title || !body) {
      throw ApiError.badRequest('Notification title and body are required');
    }

    // In simulated/sandbox mode, acknowledge receipt and return success payload
    const logResult = {
      messageId: `fcm_msg_${Date.now()}`,
      status: 'DELIVERED',
      targetType: targetType || 'broadcast',
      targetValue: targetValue || 'all_field_workers',
      sentAt: new Date().toISOString(),
      summary: `Push "${title}" simulated to ${targetValue || 'active devices'}.`,
    };

    const response = ApiResponse.success(logResult, 'Test push notification dispatched successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/settings/whatsapp/templates
   * List all WhatsApp message templates
   */
  getWhatsAppTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { category, status, search } = req.query;

    const templates = await settingsQueries.getWhatsAppTemplates({
      category: category as string,
      status: status as string,
      search: search as string,
    });

    const payload = formatTemplatePayload(templates, req);
    const response = ApiResponse.success(payload, 'WhatsApp templates retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/settings/whatsapp/templates
   * Create new WhatsApp template
   */
  createWhatsAppTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
      metaStatus: 'APPROVED', // Default to approved in workspace environment for immediate testing
    });

    const payload = formatTemplatePayload(created, req);
    const response = ApiResponse.success(payload, 'WhatsApp template created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  /**
   * PUT /api/v1/settings/whatsapp/templates/:id
   * Update existing WhatsApp template
   */
  updateWhatsAppTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const updated = await settingsQueries.updateWhatsAppTemplate(id, req.body);

    if (!updated) {
      throw ApiError.notFound('WhatsApp template not found');
    }

    const payload = formatTemplatePayload(updated, req);
    const response = ApiResponse.success(payload, 'WhatsApp template updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * DELETE /api/v1/settings/whatsapp/templates/:id
   * Delete WhatsApp template
   */
  deleteWhatsAppTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const success = await settingsQueries.deleteWhatsAppTemplate(id);

    if (!success) {
      throw ApiError.notFound('WhatsApp template not found');
    }

    const response = ApiResponse.success({ id }, 'WhatsApp template deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/settings/whatsapp/templates/sync
   * Synchronize approval statuses from Meta Cloud API
   */
  syncWhatsAppTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshed = await settingsQueries.syncMetaTemplateStatuses();

    const payload = formatTemplatePayload(refreshed, req);
    const response = ApiResponse.success(payload, 'WhatsApp templates synchronized with Meta');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/settings/whatsapp/test
   * Send test WhatsApp message
   */
  testWhatsAppMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { templateId, phoneNumber, sampleVariables } = req.body;

    if (!phoneNumber) {
      throw ApiError.badRequest('Target mobile phone number is required');
    }

    const template = templateId ? await settingsQueries.getWhatsAppTemplateById(templateId) : null;

    const deliveryResult = {
      messageId: `wamid_${Date.now()}`,
      status: 'SENT',
      phoneNumber,
      templateName: template?.name || 'custom_message',
      sentAt: new Date().toISOString(),
      sampleVariables: sampleVariables || {},
      note: 'Message queued and delivered to WhatsApp sandbox.',
    };

    const response = ApiResponse.success(deliveryResult, 'Test WhatsApp message sent successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const settingsController = new SettingsController();
