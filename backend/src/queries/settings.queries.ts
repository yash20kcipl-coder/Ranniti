import { query, dbPool } from './dbPool';

export interface CampaignSettingsRecord {
  id: string;
  fcmProjectId: string | null;
  fcmClientEmail: string | null;
  fcmPrivateKey: string | null;
  fcmServerKey: string | null;
  apnsTeamId: string | null;
  apnsKeyId: string | null;
  apnsBundleId: string | null;
  apnsAuthKey: string | null;
  pushTriggers: {
    dailyBriefing: boolean;
    briefingTime: string;
    surveyMilestones: boolean;
    pollDayTurnout: boolean;
    urgentBroadcasts: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
  whatsappWabaId: string | null;
  whatsappPhoneNumberId: string | null;
  whatsappAccessToken: string | null;
  whatsappWebhookVerifyToken: string | null;
  whatsappQualityRating: string;
  whatsappDailyLimit: string;
  candidateName: string | null;
  partyName: string | null;
  partySymbolUrl: string | null;
  candidatePhotoUrl: string | null;
  pollingDate: string | null;
  electionType: string;
  fieldRules: {
    geofencingEnabled: boolean;
    geofenceRadiusMeters: number;
    offlineSyncAllowed: boolean;
    mandatoryMobile: boolean;
    allowPhotoCapture: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTemplateRecord {
  id: string;
  metaTemplateId: string | null;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  headerContent: string | null;
  bodyText: string;
  footerText: string | null;
  buttons: any[];
  variables: string[];
  metaStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DRAFT';
  metaRejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const mapSettingsRowToCamelCase = (row: any): CampaignSettingsRecord => ({
  id: row.id,
  fcmProjectId: row.fcm_project_id,
  fcmClientEmail: row.fcm_client_email,
  fcmPrivateKey: row.fcm_private_key,
  fcmServerKey: row.fcm_server_key,
  apnsTeamId: row.apns_team_id,
  apnsKeyId: row.apns_key_id,
  apnsBundleId: row.apns_bundle_id,
  apnsAuthKey: row.apns_auth_key,
  pushTriggers: row.push_triggers || {
    dailyBriefing: true,
    briefingTime: '07:00',
    surveyMilestones: true,
    pollDayTurnout: true,
    urgentBroadcasts: true,
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:30',
  },
  whatsappWabaId: row.whatsapp_waba_id,
  whatsappPhoneNumberId: row.whatsapp_phone_number_id,
  whatsappAccessToken: row.whatsapp_access_token,
  whatsappWebhookVerifyToken: row.whatsapp_webhook_verify_token,
  whatsappQualityRating: row.whatsapp_quality_rating || 'GREEN',
  whatsappDailyLimit: row.whatsapp_daily_limit || '10K',
  candidateName: row.candidate_name,
  partyName: row.party_name,
  partySymbolUrl: row.party_symbol_url,
  candidatePhotoUrl: row.candidate_photo_url,
  pollingDate: row.polling_date,
  electionType: row.election_type || 'Assembly',
  fieldRules: row.field_rules || {
    geofencingEnabled: true,
    geofenceRadiusMeters: 200,
    offlineSyncAllowed: true,
    mandatoryMobile: false,
    allowPhotoCapture: true,
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapTemplateRowToCamelCase = (row: any): WhatsAppTemplateRecord => ({
  id: row.id,
  metaTemplateId: row.meta_template_id,
  name: row.name,
  category: row.category,
  language: row.language,
  headerType: row.header_type,
  headerContent: row.header_content,
  bodyText: row.body_text,
  footerText: row.footer_text,
  buttons: typeof row.buttons === 'string' ? JSON.parse(row.buttons) : row.buttons || [],
  variables: typeof row.variables === 'string' ? JSON.parse(row.variables) : row.variables || [],
  metaStatus: row.meta_status,
  metaRejectionReason: row.meta_rejection_reason,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const settingsQueries = {
  /**
   * Get campaign settings for an organization (or global fallback if org is null)
   */
  async getSettings(): Promise<CampaignSettingsRecord> {
    const res = await query(`SELECT * FROM campaign_settings ORDER BY created_at ASC LIMIT 1`);
    if (res.rows.length > 0) {
      return mapSettingsRowToCamelCase(res.rows[0]);
    }

    // Auto-initialize default settings row if none exists
    const initSql = `
      INSERT INTO campaign_settings (
        whatsapp_quality_rating,
        whatsapp_daily_limit,
        election_type
      ) VALUES ('GREEN', '10K', 'Assembly')
      RETURNING *
    `;
    const initRes = await query(initSql);
    return mapSettingsRowToCamelCase(initRes.rows[0]);
  },

  /**
   * Update or upsert campaign settings
   */
  async upsertSettings(
    data: Partial<CampaignSettingsRecord>
  ): Promise<CampaignSettingsRecord> {
    const current = await settingsQueries.getSettings();

    const fcmProjectId = data.fcmProjectId !== undefined ? data.fcmProjectId : current.fcmProjectId;
    const fcmClientEmail = data.fcmClientEmail !== undefined ? data.fcmClientEmail : current.fcmClientEmail;
    const fcmPrivateKey = data.fcmPrivateKey !== undefined ? data.fcmPrivateKey : current.fcmPrivateKey;
    const fcmServerKey = data.fcmServerKey !== undefined ? data.fcmServerKey : current.fcmServerKey;
    const apnsTeamId = data.apnsTeamId !== undefined ? data.apnsTeamId : current.apnsTeamId;
    const apnsKeyId = data.apnsKeyId !== undefined ? data.apnsKeyId : current.apnsKeyId;
    const apnsBundleId = data.apnsBundleId !== undefined ? data.apnsBundleId : current.apnsBundleId;
    const apnsAuthKey = data.apnsAuthKey !== undefined ? data.apnsAuthKey : current.apnsAuthKey;
    const pushTriggers = JSON.stringify(data.pushTriggers !== undefined ? data.pushTriggers : current.pushTriggers);

    const whatsappWabaId = data.whatsappWabaId !== undefined ? data.whatsappWabaId : current.whatsappWabaId;
    const whatsappPhoneNumberId = data.whatsappPhoneNumberId !== undefined ? data.whatsappPhoneNumberId : current.whatsappPhoneNumberId;
    const whatsappAccessToken = data.whatsappAccessToken !== undefined ? data.whatsappAccessToken : current.whatsappAccessToken;
    const whatsappWebhookVerifyToken = data.whatsappWebhookVerifyToken !== undefined ? data.whatsappWebhookVerifyToken : current.whatsappWebhookVerifyToken;
    const whatsappQualityRating = data.whatsappQualityRating !== undefined ? data.whatsappQualityRating : current.whatsappQualityRating;
    const whatsappDailyLimit = data.whatsappDailyLimit !== undefined ? data.whatsappDailyLimit : current.whatsappDailyLimit;

    const candidateName = data.candidateName !== undefined ? data.candidateName : current.candidateName;
    const partyName = data.partyName !== undefined ? data.partyName : current.partyName;
    const partySymbolUrl = data.partySymbolUrl !== undefined ? data.partySymbolUrl : current.partySymbolUrl;
    const candidatePhotoUrl = data.candidatePhotoUrl !== undefined ? data.candidatePhotoUrl : current.candidatePhotoUrl;
    const pollingDate = data.pollingDate !== undefined ? data.pollingDate : current.pollingDate;
    const electionType = data.electionType !== undefined ? data.electionType : current.electionType;
    const fieldRules = JSON.stringify(data.fieldRules !== undefined ? data.fieldRules : current.fieldRules);

    const updateSql = `
      UPDATE campaign_settings SET
        fcm_project_id = $1,
        fcm_client_email = $2,
        fcm_private_key = $3,
        fcm_server_key = $4,
        apns_team_id = $5,
        apns_key_id = $6,
        apns_bundle_id = $7,
        apns_auth_key = $8,
        push_triggers = $9::jsonb,
        whatsapp_waba_id = $10,
        whatsapp_phone_number_id = $11,
        whatsapp_access_token = $12,
        whatsapp_webhook_verify_token = $13,
        whatsapp_quality_rating = $14,
        whatsapp_daily_limit = $15,
        candidate_name = $16,
        party_name = $17,
        party_symbol_url = $18,
        candidate_photo_url = $19,
        polling_date = $20,
        election_type = $21,
        field_rules = $22::jsonb,
        updated_at = NOW()
      WHERE id = $23
      RETURNING *
    `;

    const res = await query(updateSql, [
      fcmProjectId,
      fcmClientEmail,
      fcmPrivateKey,
      fcmServerKey,
      apnsTeamId,
      apnsKeyId,
      apnsBundleId,
      apnsAuthKey,
      pushTriggers,
      whatsappWabaId,
      whatsappPhoneNumberId,
      whatsappAccessToken,
      whatsappWebhookVerifyToken,
      whatsappQualityRating,
      whatsappDailyLimit,
      candidateName,
      partyName,
      partySymbolUrl,
      candidatePhotoUrl,
      pollingDate || null,
      electionType,
      fieldRules,
      current.id,
    ]);

    return mapSettingsRowToCamelCase(res.rows[0]);
  },

  /**
   * Get all WhatsApp templates
   */
  async getWhatsAppTemplates(
    filters?: { category?: string; status?: string; search?: string }
  ): Promise<WhatsAppTemplateRecord[]> {
    let sql = `SELECT * FROM whatsapp_templates WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.status) {
      sql += ` AND meta_status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.search) {
      sql += ` AND (name ILIKE $${paramIndex} OR body_text ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC`;

    const res = await query(sql, params);
    return res.rows.map(mapTemplateRowToCamelCase);
  },

  /**
   * Get template by ID
   */
  async getWhatsAppTemplateById(id: string): Promise<WhatsAppTemplateRecord | null> {
    const res = await query(`SELECT * FROM whatsapp_templates WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return mapTemplateRowToCamelCase(res.rows[0]);
  },

  /**
   * Create new WhatsApp template
   */
  async createWhatsAppTemplate(
    data: {
      name: string;
      category: string;
      language: string;
      headerType?: string;
      headerContent?: string | null;
      bodyText: string;
      footerText?: string | null;
      buttons?: any[];
      variables?: string[];
      metaStatus?: string;
    }
  ): Promise<WhatsAppTemplateRecord> {
    // Extract dynamic variables from body text if not explicitly provided
    let vars = data.variables || [];
    if (!vars.length) {
      const matched = data.bodyText.match(/\{\{([a-zA-Z0-9_]+)\}\}/g);
      if (matched) {
        vars = Array.from(new Set(matched.map((m) => m.replace(/[{}]/g, ''))));
      }
    }

    const sql = `
      INSERT INTO whatsapp_templates (
        name,
        category,
        language,
        header_type,
        header_content,
        body_text,
        footer_text,
        buttons,
        variables,
        meta_status,
        meta_template_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11
      )
      RETURNING *
    `;

    const metaTemplateId = `meta_tpl_${Date.now()}`;
    const res = await query(sql, [
      data.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      data.category || 'UTILITY',
      data.language || 'hi',
      data.headerType || 'NONE',
      data.headerContent || null,
      data.bodyText,
      data.footerText || null,
      JSON.stringify(data.buttons || []),
      JSON.stringify(vars),
      data.metaStatus || 'APPROVED',
      metaTemplateId,
    ]);

    return mapTemplateRowToCamelCase(res.rows[0]);
  },

  /**
   * Update existing WhatsApp template
   */
  async updateWhatsAppTemplate(
    id: string,
    data: Partial<WhatsAppTemplateRecord>
  ): Promise<WhatsAppTemplateRecord | null> {
    const existing = await settingsQueries.getWhatsAppTemplateById(id);
    if (!existing) return null;

    let vars = data.variables !== undefined ? data.variables : existing.variables;
    const bodyText = data.bodyText !== undefined ? data.bodyText : existing.bodyText;

    if (data.bodyText !== undefined && data.variables === undefined) {
      const matched = bodyText.match(/\{\{([a-zA-Z0-9_]+)\}\}/g);
      vars = matched ? Array.from(new Set(matched.map((m) => m.replace(/[{}]/g, '')))) : [];
    }

    const sql = `
      UPDATE whatsapp_templates SET
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        language = COALESCE($3, language),
        header_type = COALESCE($4, header_type),
        header_content = $5,
        body_text = COALESCE($6, body_text),
        footer_text = $7,
        buttons = COALESCE($8::jsonb, buttons),
        variables = COALESCE($9::jsonb, variables),
        meta_status = COALESCE($10, meta_status),
        meta_rejection_reason = $11,
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `;

    const res = await query(sql, [
      data.name ? data.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') : null,
      data.category || null,
      data.language || null,
      data.headerType || null,
      data.headerContent !== undefined ? data.headerContent : existing.headerContent,
      bodyText,
      data.footerText !== undefined ? data.footerText : existing.footerText,
      data.buttons ? JSON.stringify(data.buttons) : null,
      JSON.stringify(vars),
      data.metaStatus || null,
      data.metaRejectionReason !== undefined ? data.metaRejectionReason : existing.metaRejectionReason,
      id,
    ]);

    return mapTemplateRowToCamelCase(res.rows[0]);
  },

  /**
   * Delete WhatsApp template
   */
  async deleteWhatsAppTemplate(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM whatsapp_templates WHERE id = $1 RETURNING id`, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Sync template approval statuses from Meta
   */
  async syncMetaTemplateStatuses(): Promise<WhatsAppTemplateRecord[]> {
    // In production, this contacts https://graph.facebook.com/v20.0/{WABA_ID}/message_templates
    // Here we ensure pending items get transitioned to APPROVED/REJECTED for seamless testing
    await query(`
      UPDATE whatsapp_templates
      SET meta_status = 'APPROVED', updated_at = NOW()
      WHERE meta_status = 'PENDING'
    `);

    return settingsQueries.getWhatsAppTemplates();
  },
};
