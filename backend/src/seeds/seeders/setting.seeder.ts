import fs from 'fs';
import path from 'path';
import { query as mainQuery, closeDbPool } from '../../queries/dbPool';
import { TenantPoolManager } from '../../utils/tenantPoolManager';
import { logger } from '../../utils/logger';

export interface DefaultWhatsAppTemplate {
  metaTemplateId: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  headerContent: string | null;
  bodyText: string;
  footerText: string | null;
  buttons?: any[];
  variables?: string[];
  metaStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DRAFT';
}

export const DEFAULT_WHATSAPP_TEMPLATES: DefaultWhatsAppTemplate[] = [
  {
    metaTemplateId: 'TMPL_VOTER_SLIP_01',
    name: 'voter_slip_delivery',
    category: 'UTILITY',
    language: 'hi',
    headerType: 'TEXT',
    headerContent: 'मतदाता पर्ची - चुनाव 2026',
    bodyText: 'नमस्ते {{1}}, आपका मतदान केंद्र {{2}} है। भाग संख्या {{3}}, क्रमांक संख्या {{4}}। कृपया 20 नवंबर को मतदान अवश्य करें।',
    footerText: 'रणनीति इलेक्शन सेल',
    buttons: [{ type: 'QUICK_REPLY', text: 'स्थान मैप देखें' }],
    variables: ['1', '2', '3', '4'],
    metaStatus: 'APPROVED',
  },
  {
    metaTemplateId: 'TMPL_RALLY_INVITE_02',
    name: 'campaign_rally_invite',
    category: 'MARKETING',
    language: 'hi',
    headerType: 'IMAGE',
    headerContent: '/uploads/campaign/rally.png',
    bodyText: 'प्रिय कार्यकर्ता {{1}}, कल शाम 5 बजे {{2}} में विशाल जनसभा आयोजित है। उम्मीदवार {{3}} जी मार्गदर्शन करेंगे। अपनी उपस्थिति सुनिश्चित करें।',
    footerText: 'प्रचार समिति',
    buttons: [{ type: 'URL', text: 'स्थान दिशा-निर्देश', url: 'https://maps.google.com' }],
    variables: ['1', '2', '3'],
    metaStatus: 'APPROVED',
  },
  {
    metaTemplateId: 'TMPL_BOOTH_TASK_03',
    name: 'booth_worker_briefing',
    category: 'UTILITY',
    language: 'en',
    headerType: 'NONE',
    headerContent: null,
    bodyText: 'Hello {{1}}, you are assigned as Booth Incharge for Booth #{{2}} - {{3}}. Target voters: {{4}}. Please complete morning setup by 6:00 AM.',
    footerText: 'Ranniti Campaign HQ',
    buttons: [{ type: 'QUICK_REPLY', text: 'Confirm Attendance' }],
    variables: ['1', '2', '3', '4'],
    metaStatus: 'APPROVED',
  },
  {
    metaTemplateId: 'TMPL_POLL_DAY_04',
    name: 'poll_day_reminder',
    category: 'UTILITY',
    language: 'hi',
    headerType: 'TEXT',
    headerContent: 'मतदान दिवस स्मरण पत्र',
    bodyText: 'सम्मानित मतदाता {{1}}, आज मतदान का दिन है! लोकतंत्र के महापर्व में भाग लें और अपना बहुमूल्य वोट डालें। मतदान समय: प्रातः 7:00 से सायं 6:00 तक।',
    footerText: 'रणनीति टीम',
    variables: ['1'],
    metaStatus: 'APPROVED',
  },
  {
    metaTemplateId: 'TMPL_BOOTH_TURNOUT_05',
    name: 'booth_turnout_alert',
    category: 'UTILITY',
    language: 'hi',
    headerType: 'TEXT',
    headerContent: 'बूथ मतदान प्रतिशत अलर्ट',
    bodyText: 'बूथ प्रभारी {{1}}, दोपहर 1:00 बजे तक आपके बूथ #{{2}} पर केवल {{3}}% मतदान दर्ज हुआ है। छूटे हुए मतदाताओं से संपर्क तेज करें।',
    footerText: 'इलेक्शन वॉर रूम',
    variables: ['1', '2', '3'],
    metaStatus: 'APPROVED',
  },
  {
    metaTemplateId: 'TMPL_FESTIVE_GREET_06',
    name: 'festive_greetings',
    category: 'MARKETING',
    language: 'hi',
    headerType: 'IMAGE',
    headerContent: '/uploads/campaign/greeting.png',
    bodyText: 'प्रिय {{1}} जी, आपको एवं आपके परिवार को त्योहार की हार्दिक शुभकामनाएं! खुशहाली और समृद्धि की कामना के साथ - {{2}}।',
    footerText: 'उम्मीदवार संपर्क कार्यालय',
    variables: ['1', '2'],
    metaStatus: 'APPROVED',
  }
];

/**
 * Seed campaign settings and WhatsApp templates for a specific DB target (Master DB or Tenant DB).
 */
export const seedSettings = async (tenantDbName?: string): Promise<void> => {
  const dbLabel = tenantDbName ? `Tenant DB (${tenantDbName})` : 'Master DB';
  logger.info(`⚙️ Seeding Campaign Settings & WhatsApp Templates for ${dbLabel}...`);

  const queryFn = async (sql: string, params: any[] = []) => {
    if (tenantDbName && tenantDbName.trim()) {
      return await TenantPoolManager.query(tenantDbName.trim(), sql, params);
    }
    return await mainQuery(sql, params);
  };

  try {
    // 0. Ensure tables exist by running migration schema if missing
    const migrationPath = path.join(__dirname, '../../database/migrations/create_campaign_settings_tables.sql');
    if (fs.existsSync(migrationPath)) {
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');
      await queryFn(sqlContent);
    }
    // 1. Seed Campaign Settings if empty
    const csRes = await queryFn(`SELECT id FROM campaign_settings LIMIT 1`);
    if (csRes.rows.length === 0) {
      await queryFn(`
        INSERT INTO campaign_settings (
          candidate_name,
          party_name,
          party_symbol_url,
          candidate_photo_url,
          polling_date,
          election_type,
          whatsapp_quality_rating,
          whatsapp_daily_limit,
          whatsapp_waba_id,
          whatsapp_phone_number_id,
          whatsapp_webhook_verify_token,
          fcm_project_id,
          push_triggers,
          field_rules
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb
        )
      `, [
        'Rajesh Patil',
        'Nationalist Congress Party',
        '/uploads/parties/ncp.png',
        '/uploads/avatars/leader.png',
        '2026-11-20',
        'Assembly',
        'GREEN',
        '10K',
        'WABA_1092837465',
        'PHONE_919820011223',
        'ranniti_wh_secret_2026',
        'ranniti-campaign-2026',
        JSON.stringify({
          dailyBriefing: true,
          briefingTime: '07:00',
          surveyMilestones: true,
          pollDayTurnout: true,
          urgentBroadcasts: true,
          quietHoursEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '06:30',
        }),
        JSON.stringify({
          geofencingEnabled: true,
          geofenceRadiusMeters: 200,
          offlineSyncAllowed: true,
          mandatoryMobile: false,
          allowPhotoCapture: true,
        })
      ]);
      logger.info(`✅ Seeded default Campaign Settings for ${dbLabel}.`);
    } else {
      logger.info(`ℹ️ Campaign Settings already present for ${dbLabel}.`);
    }

    // 2. Ensure unique index on whatsapp_templates
    try {
      await queryFn(`CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_templates_name_lang ON whatsapp_templates(name, language);`);
    } catch (idxErr: any) {
      // index may already exist
    }

    // 3. Seed WhatsApp Templates
    for (const t of DEFAULT_WHATSAPP_TEMPLATES) {
      await queryFn(
        `INSERT INTO whatsapp_templates (
          meta_template_id, name, category, language, header_type, header_content, body_text, footer_text, buttons, variables, meta_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11)
        ON CONFLICT (name, language) DO UPDATE SET
          meta_template_id = EXCLUDED.meta_template_id,
          category = EXCLUDED.category,
          header_type = EXCLUDED.header_type,
          header_content = EXCLUDED.header_content,
          body_text = EXCLUDED.body_text,
          footer_text = EXCLUDED.footer_text,
          buttons = EXCLUDED.buttons,
          variables = EXCLUDED.variables,
          meta_status = EXCLUDED.meta_status,
          updated_at = NOW()`,
        [
          t.metaTemplateId,
          t.name,
          t.category,
          t.language,
          t.headerType,
          t.headerContent,
          t.bodyText,
          t.footerText,
          JSON.stringify(t.buttons || []),
          JSON.stringify(t.variables || []),
          t.metaStatus,
        ]
      );
    }
    logger.info(`✅ Seeded ${DEFAULT_WHATSAPP_TEMPLATES.length} WhatsApp Templates for ${dbLabel}.`);
  } catch (err: any) {
    logger.error(`❌ Failed to seed settings for ${dbLabel}:`, err);
    throw err;
  }
};

/**
 * Seed settings across all active tenant databases.
 */
export const seedAllTenantSettings = async (): Promise<void> => {
  const tenants = await mainQuery(
    `SELECT tenant_db_name AS db_name FROM tenants WHERE status IN ('ready', 'active') AND tenant_db_name IS NOT NULL`
  );

  if (!tenants.rows || tenants.rows.length === 0) {
    logger.info('ℹ️ No active tenant databases found for settings seeding.');
    return;
  }

  for (const tenant of tenants.rows) {
    await seedSettings(tenant.db_name);
  }
};

// CLI execution handling
if (require.main === module) {
  (async () => {
    try {
      await seedSettings();
      await seedAllTenantSettings();
      logger.info('🎉 Settings Seeder completed successfully.');
      process.exit(0);
    } catch (err) {
      logger.error('💥 Settings Seeder failed:', err);
      process.exit(1);
    } finally {
      await TenantPoolManager.closeAllPools();
      await closeDbPool();
    }
  })();
}
