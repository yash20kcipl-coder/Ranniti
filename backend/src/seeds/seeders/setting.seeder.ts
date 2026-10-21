import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';
import { query as mainQuery, closeDbPool } from '../../queries/dbPool';
import { TenantPoolManager } from '../../services/pool/tenantPoolManager';

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
  // 1. Digital Voter Slip (Hindi)
  {
    metaTemplateId: 'TMPL_VOTER_SLIP_HI',
    name: 'digital_voter_slip',
    category: 'UTILITY',
    language: 'hi',
    headerType: 'TEXT',
    headerContent: 'मतदाता पर्ची - चुनाव 2026',
    bodyText: 'नमस्ते {{voter_name}}, आपका मतदान केंद्र {{booth_name}} है। भाग/वार्ड संख्या {{section_no}}, क्रमांक संख्या #{{serial_no}}। मतदान दिवस {{polling_date}} को सपरिवार मतदान अवश्य करें।',
    footerText: 'रणनीति इलेक्शन सेल',
    buttons: [{ type: 'QUICK_REPLY', text: 'स्थान मैप देखें' }],
    variables: ['voter_name', 'booth_name', 'section_no', 'serial_no', 'polling_date'],
    metaStatus: 'APPROVED',
  },
  // 2. Digital Voter Slip (English)
  {
    metaTemplateId: 'TMPL_VOTER_SLIP_EN',
    name: 'digital_voter_slip',
    category: 'UTILITY',
    language: 'en',
    headerType: 'TEXT',
    headerContent: 'Digital Voter Slip - Election 2026',
    bodyText: 'Namaste {{voter_name}}, your polling station is {{booth_name}}. Part/Ward: {{section_no}}, Serial No: #{{serial_no}}. Polling Date: {{polling_date}}. Please cast your valuable vote with your family.',
    footerText: 'Ranniti Election Cell',
    buttons: [{ type: 'QUICK_REPLY', text: 'View Polling Station' }],
    variables: ['voter_name', 'booth_name', 'section_no', 'serial_no', 'polling_date'],
    metaStatus: 'APPROVED',
  },
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
    if (tenantDbName) {
      const cleanupPath = path.join(__dirname, '../../database/migrations/remove_tenant_whatsapp_config_and_templates.sql');
      if (fs.existsSync(cleanupPath)) {
        const cleanupSql = fs.readFileSync(cleanupPath, 'utf8');
        await queryFn(cleanupSql);
      }
    }
    const appVersionMigrationPath = path.join(__dirname, '../../database/migrations/create_app_versions_table.sql');
    if (fs.existsSync(appVersionMigrationPath)) {
      const sqlContent = fs.readFileSync(appVersionMigrationPath, 'utf8');
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
          fcm_project_id,
          push_triggers,
          field_rules
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb
        )
      `, [
        'Rajesh Patil',
        'Nationalist Congress Party',
        '/uploads/parties/ncp.png',
        '/uploads/avatars/leader.png',
        '2026-11-20',
        'Assembly',
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

    // 2. Seed WhatsApp Templates (Master and Tenant DBs)
    try {
      await queryFn(`CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_templates_name_lang ON whatsapp_templates(name, language);`);
    } catch (idxErr: any) {
      // index may already exist
    }

    // Only delete obsolete templates on Master DB
    if (!tenantDbName) {
      await queryFn(
        `DELETE FROM whatsapp_templates WHERE header_type IN ('IMAGE', 'VIDEO', 'DOCUMENT') OR name IN ('voter_slip_delivery', 'campaign_rally_invite', 'booth_worker_briefing', 'booth_turnout_alert', 'festive_greetings', 'poll_day_reminder');`
      );
    }

    // For tenant DB: only insert defaults if tenant has no templates yet, so tenant custom templates are preserved!
    let shouldSeed = true;
    if (tenantDbName) {
      const existingCount = await queryFn(`SELECT COUNT(*)::int AS count FROM whatsapp_templates`);
      if ((existingCount.rows[0]?.count || 0) > 0) {
        shouldSeed = false;
        logger.info(`ℹ️ WhatsApp Templates already present for ${dbLabel}.`);
      }
    }

    if (shouldSeed) {
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
    }

    try {
      const { CacheService } = await import('../../services/cache.service');
      await CacheService.invalidatePattern(`ranniti:wa_templates:${tenantDbName || 'master'}`);
    } catch (_cacheErr) {
      // cache optional
    }
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
