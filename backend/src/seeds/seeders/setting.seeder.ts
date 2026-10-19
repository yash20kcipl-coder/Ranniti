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
  // 3. Polling Day Reminder (Hindi)
  {
    metaTemplateId: 'TMPL_POLL_REMINDER_HI',
    name: 'polling_day_reminder',
    category: 'UTILITY',
    language: 'hi',
    headerType: 'TEXT',
    headerContent: 'मतदान दिवस स्मरण पत्र',
    bodyText: 'सम्मानित मतदाता {{voter_name}}, आज मतदान का दिन है! लोकतंत्र के महापर्व में भाग लें और अपना बहुमूल्य वोट डालें। मतदान केंद्र: {{booth_name}}, मतदाता क्रमांक: #{{serial_no}}। मतदान समय: प्रातः 7:00 से सायं 6:00 तक।',
    footerText: 'रणनीति टीम',
    buttons: [{ type: 'QUICK_REPLY', text: 'मैंने वोट डाल दिया' }],
    variables: ['voter_name', 'booth_name', 'serial_no'],
    metaStatus: 'APPROVED',
  },
  // 4. Polling Day Reminder (English)
  {
    metaTemplateId: 'TMPL_POLL_REMINDER_EN',
    name: 'polling_day_reminder',
    category: 'UTILITY',
    language: 'en',
    headerType: 'TEXT',
    headerContent: 'Polling Day Reminder',
    bodyText: 'Dear Voter {{voter_name}}, today is Election Day! Please cast your valuable vote at Booth {{booth_name}}, Serial No: #{{serial_no}}. Polling hours: 7:00 AM to 6:00 PM.',
    footerText: 'Ranniti Campaign HQ',
    buttons: [{ type: 'QUICK_REPLY', text: 'I Have Voted' }],
    variables: ['voter_name', 'booth_name', 'serial_no'],
    metaStatus: 'APPROVED',
  },
  // 5. Candidate Voter Appeal (Hindi)
  {
    metaTemplateId: 'TMPL_CANDIDATE_APPEAL_HI',
    name: 'candidate_voter_appeal',
    category: 'MARKETING',
    language: 'hi',
    headerType: 'TEXT',
    headerContent: 'विनम्र जन अपील',
    bodyText: 'नमस्ते {{voter_name}} जी, क्षेत्र के सर्वांगीण विकास, बेहतर शिक्षा, रोजगार एवं जनसुविधाओं हेतु अपने लोकप्रिय प्रत्याशी {{candidate_name}} ({{party_name}}) को अपना आशीर्वाद एवं समर्थन प्रदान करें।',
    footerText: 'प्रचार समिति',
    buttons: [{ type: 'QUICK_REPLY', text: 'समर्थन दर्ज करें' }],
    variables: ['voter_name', 'candidate_name', 'party_name'],
    metaStatus: 'APPROVED',
  },
  // 6. Candidate Voter Appeal (English)
  {
    metaTemplateId: 'TMPL_CANDIDATE_APPEAL_EN',
    name: 'candidate_voter_appeal',
    category: 'MARKETING',
    language: 'en',
    headerType: 'TEXT',
    headerContent: 'Candidate Appeal',
    bodyText: 'Dear {{voter_name}}, for holistic development, better education, infrastructure, and public welfare, we humbly seek your blessing and support for candidate {{candidate_name}} ({{party_name}}).',
    footerText: 'Campaign Committee',
    buttons: [{ type: 'QUICK_REPLY', text: 'Pledge Support' }],
    variables: ['voter_name', 'candidate_name', 'party_name'],
    metaStatus: 'APPROVED',
  },
  // 7. Booth Assistance Helpline (Hindi)
  {
    metaTemplateId: 'TMPL_BOOTH_HELP_HI',
    name: 'booth_assistance_helpline',
    category: 'UTILITY',
    language: 'hi',
    headerType: 'TEXT',
    headerContent: 'मतदान सहायता केंद्र',
    bodyText: 'नमस्ते {{voter_name}} जी, मतदान केंद्र {{booth_name}} पर वरिष्ठ नागरिकों के लिए वाहन सुविधा, व्हीलचेयर या मतदाता पर्ची सहायता हेतु हमारी वॉर रूम हेल्पलाइन उपलब्ध है। किसी भी असुविधा पर संपर्क करें।',
    footerText: 'मतदाता सहायता डेस्क',
    buttons: [{ type: 'QUICK_REPLY', text: 'सहायता चाहिए' }],
    variables: ['voter_name', 'booth_name'],
    metaStatus: 'APPROVED',
  },
  // 8. Booth Assistance Helpline (English)
  {
    metaTemplateId: 'TMPL_BOOTH_HELP_EN',
    name: 'booth_assistance_helpline',
    category: 'UTILITY',
    language: 'en',
    headerType: 'TEXT',
    headerContent: 'Voter Assistance Helpline',
    bodyText: 'Hello {{voter_name}}, for Booth {{booth_name}}, transport assistance for senior citizens, wheelchair support, or voter slip queries, our volunteer helpline is ready to assist you.',
    footerText: 'Voter Helpdesk',
    buttons: [{ type: 'QUICK_REPLY', text: 'Need Assistance' }],
    variables: ['voter_name', 'booth_name'],
    metaStatus: 'APPROVED',
  },
  // 9. Post Vote Gratitude (Hindi)
  {
    metaTemplateId: 'TMPL_GRATITUDE_HI',
    name: 'post_vote_gratitude',
    category: 'MARKETING',
    language: 'hi',
    headerType: 'TEXT',
    headerContent: 'हार्दिक आभार एवं धन्यवाद',
    bodyText: 'प्रिय {{voter_name}} जी, लोकतंत्र के महापर्व में अपने मताधिकार का प्रयोग कर देश के विकास में योगदान देने हेतु आपका हृदय से बहुत-बहुत आभार एवं साधुवाद!',
    footerText: 'रणनीति परिवार',
    buttons: [{ type: 'QUICK_REPLY', text: 'जय हिंद' }],
    variables: ['voter_name'],
    metaStatus: 'APPROVED',
  },
  // 10. Post Vote Gratitude (English)
  {
    metaTemplateId: 'TMPL_GRATITUDE_EN',
    name: 'post_vote_gratitude',
    category: 'MARKETING',
    language: 'en',
    headerType: 'TEXT',
    headerContent: 'Sincere Gratitude',
    bodyText: 'Dear {{voter_name}}, thank you sincerely for exercising your democratic right and casting your vote! Your participation strengthens our democracy and community.',
    footerText: 'Ranniti Family',
    buttons: [{ type: 'QUICK_REPLY', text: 'Thank You' }],
    variables: ['voter_name'],
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

    // 2. Seed WhatsApp Templates (Master DB Only)
    if (!tenantDbName) {
      try {
        await queryFn(`CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_templates_name_lang ON whatsapp_templates(name, language);`);
      } catch (idxErr: any) {
        // index may already exist
      }

      // Remove obsolete media templates and old template names
      await queryFn(
        `DELETE FROM whatsapp_templates WHERE header_type IN ('IMAGE', 'VIDEO', 'DOCUMENT') OR name IN ('voter_slip_delivery', 'campaign_rally_invite', 'booth_worker_briefing', 'booth_turnout_alert', 'festive_greetings', 'poll_day_reminder');`
      );

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
      try {
        const { CacheService } = await import('../../services/cache.service');
        await CacheService.invalidatePattern('ranniti:wa_templates:*');
      } catch (_cacheErr) {
        // cache optional
      }
      logger.info(`✅ Seeded ${DEFAULT_WHATSAPP_TEMPLATES.length} WhatsApp Templates for Master DB.`);
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
