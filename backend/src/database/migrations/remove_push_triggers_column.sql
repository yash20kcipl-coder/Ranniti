-- Migration: Remove push_triggers column from campaign_settings table
-- Description: Notification triggers configuration is removed from campaign_settings.

ALTER TABLE campaign_settings DROP COLUMN IF EXISTS push_triggers;
