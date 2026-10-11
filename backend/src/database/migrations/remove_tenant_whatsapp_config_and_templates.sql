-- Migration: Remove WhatsApp Config & Templates strictly from Tenant DB
-- Description: Drops WhatsApp credential columns from campaign_settings and drops whatsapp_templates table on tenant DBs.

ALTER TABLE campaign_settings
  DROP COLUMN IF EXISTS whatsapp_waba_id,
  DROP COLUMN IF EXISTS whatsapp_phone_number_id,
  DROP COLUMN IF EXISTS whatsapp_access_token,
  DROP COLUMN IF EXISTS whatsapp_webhook_verify_token,
  DROP COLUMN IF EXISTS whatsapp_quality_rating,
  DROP COLUMN IF EXISTS whatsapp_daily_limit;

DROP TABLE IF EXISTS whatsapp_templates;
