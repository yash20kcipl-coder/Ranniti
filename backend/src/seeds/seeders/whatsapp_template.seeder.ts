import { logger } from '../../utils/logger';
import { query as mainQuery, closeDbPool } from '../../queries/dbPool';
import { DEFAULT_WHATSAPP_TEMPLATES } from './setting.seeder';

/**
 * Discrete runner to seed ONLY WhatsApp / SMS templates in Master DB.
 */
export const seedWhatsAppTemplatesOnly = async (): Promise<void> => {
  logger.info('📱 Seeding WhatsApp & SMS Text Templates for Master DB...');

  try {
    // 1. Ensure table exists
    await mainQuery(`
      CREATE TABLE IF NOT EXISTS whatsapp_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meta_template_id VARCHAR(100),
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        language VARCHAR(10) NOT NULL,
        header_type VARCHAR(20) DEFAULT 'NONE',
        header_content TEXT,
        body_text TEXT NOT NULL,
        footer_text TEXT,
        buttons JSONB DEFAULT '[]'::jsonb,
        variables JSONB DEFAULT '[]'::jsonb,
        meta_status VARCHAR(20) DEFAULT 'APPROVED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Ensure unique index on (name, language)
    try {
      await mainQuery(`CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_templates_name_lang ON whatsapp_templates(name, language);`);
    } catch (_idxErr) {
      // index already exists
    }

    // 3. Remove obsolete media templates and old mock template names
    await mainQuery(
      `DELETE FROM whatsapp_templates WHERE header_type IN ('IMAGE', 'VIDEO', 'DOCUMENT') OR name IN ('voter_slip_delivery', 'campaign_rally_invite', 'booth_worker_briefing', 'booth_turnout_alert', 'festive_greetings', 'poll_day_reminder');`
    );

    // 4. Upsert the clean 10 text templates
    for (const t of DEFAULT_WHATSAPP_TEMPLATES) {
      await mainQuery(
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

    // 5. Invalidate Redis cache so web and mobile APIs immediately reflect changes
    try {
      const { CacheService } = await import('../../services/cache.service');
      await CacheService.invalidatePattern('ranniti:wa_templates:*');
      logger.info('🧹 Invalidated Redis cache for ranniti:wa_templates:*');
    } catch (_cacheErr) {
      // cache service is optional
    }

    logger.info(`✅ Successfully seeded ${DEFAULT_WHATSAPP_TEMPLATES.length} WhatsApp & SMS templates in Master DB.`);
  } catch (err: any) {
    logger.error('❌ Failed to seed WhatsApp templates:', err);
    throw err;
  }
};

// CLI runner
if (require.main === module) {
  (async () => {
    try {
      await seedWhatsAppTemplatesOnly();
      logger.info('🎉 WhatsApp Templates seeding completed successfully.');
      process.exit(0);
    } catch (err) {
      logger.error('💥 WhatsApp Templates seeding failed:', err);
      process.exit(1);
    } finally {
      await closeDbPool();
    }
  })();
}
