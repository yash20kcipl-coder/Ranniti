import { normalizeIndianMobile } from '../utils/indianPhoneSanitizer';
import { logger } from '../utils/logger';

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
  simulated?: boolean;
}

export class SmsService {
  /**
   * Dispatches an OTP SMS to an Indian mobile number using the KeyConcepts / DLT Bulk SMS Gateway.
   */
  static async sendOtpSms(mobile: string, otpCode: string): Promise<SendSmsResult> {
    const cleanMobile = normalizeIndianMobile(mobile);
    if (!cleanMobile) {
      return {
        success: false,
        error: 'Invalid Indian mobile number. Mobile number must be 10 digits starting with 6-9.',
      };
    }

    const gatewayUrl = process.env.SMS_GATEWAY_URL || 'http://bulksms.keyconcepts.co.in/submitsms.jsp';
    const user = process.env.SMS_USER;
    const key = process.env.SMS_KEY;
    const senderId = process.env.SMS_SENDER_ID || 'KEYCON';
    const entityId = process.env.SMS_ENTITY_ID;
    const tempId = process.env.SMS_OTP_TEMPID;
    const rawTemplate = process.env.SMS_OTP_TEMPLATE || 'Your OTP for Ranniti login is {#var#}. Valid for 5 minutes.';

    // Check if credentials are unconfigured or placeholders
    const isPlaceholder = !user || !key || user === 'your_username' || key === 'your_api_key';

    if (isPlaceholder) {
      logger.error(
        `[SmsService] SMS gateway credentials are not configured in environment (SMS_USER / SMS_KEY). Cannot send SMS to ${cleanMobile}.`
      );
      return {
        success: false,
        error: 'SMS gateway credentials (SMS_USER / SMS_KEY) are not configured in server environment.',
      };
    }

    // Format DLT message text with OTP value
    let messageText = rawTemplate;
    if (messageText.includes('{#var#}')) {
      messageText = messageText.replace('{#var#}', otpCode);
    } else if (messageText.includes('{OTP}')) {
      messageText = messageText.replace('{OTP}', otpCode);
    } else if (messageText.includes('{#var1#}')) {
      messageText = messageText.replace('{#var1#}', otpCode);
    } else {
      messageText = `${messageText} ${otpCode}`;
    }

    try {
      const url = new URL(gatewayUrl);
      url.searchParams.set('user', user);
      url.searchParams.set('key', key);
      url.searchParams.set('mobile', cleanMobile);
      url.searchParams.set('message', messageText);
      url.searchParams.set('senderid', senderId);
      url.searchParams.set('accusage', '1'); // Transactional DLT Route
      if (entityId) url.searchParams.set('entityid', entityId);
      if (tempId) url.searchParams.set('tempid', tempId);

      logger.info(
        `[SmsService] Dispatching OTP SMS via ${gatewayUrl} to mobile: ${cleanMobile}, sender: ${senderId}, tempid: ${tempId}`
      );

      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseText = (await response.text()).trim();
      logger.info(`[SmsService] Gateway response for ${cleanMobile}: status=${response.status}, body="${responseText}"`);

      // KeyConcepts BulkSMS success format: "sent,success,jobId,..."
      // On failure it returns errors like "error,101,...", "invalid user", etc.
      const lowerResp = responseText.toLowerCase();
      const isSuccess = response.ok && (lowerResp.startsWith('sent') || lowerResp.includes('success'));

      if (!isSuccess) {
        logger.error(`[SmsService] Gateway rejected SMS to ${cleanMobile}. Gateway response: "${responseText}"`);
        return {
          success: false,
          error: `SMS Gateway failed to send OTP: ${responseText || `HTTP error ${response.status}`}`,
          response: responseText,
        };
      }

      return {
        success: true,
        messageId: responseText,
        response: responseText,
      };
    } catch (error: any) {
      logger.error(`[SmsService] Network or timeout error connecting to SMS Gateway for ${cleanMobile}:`, error);
      return {
        success: false,
        error: error?.message || 'Failed to connect to SMS gateway provider.',
      };
    }
  }
}
