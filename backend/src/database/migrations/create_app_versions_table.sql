-- Migration: create_app_versions_table.sql
-- Description: Table for storing app version controls, store links, force update flags, and maintenance mode settings per platform

CREATE TABLE IF NOT EXISTS app_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL UNIQUE, -- 'android' | 'ios'
    min_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    latest_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    force_update BOOLEAN NOT NULL DEFAULT false,
    update_title VARCHAR(255) DEFAULT 'App Update Available',
    update_message TEXT DEFAULT 'A new version of Ranniti is available. Update now to enjoy the latest features and security enhancements.',
    store_url VARCHAR(500) NOT NULL DEFAULT '',
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    maintenance_message TEXT DEFAULT 'Ranniti is currently undergoing scheduled maintenance. Please check back shortly.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookup by platform
CREATE INDEX IF NOT EXISTS idx_app_versions_platform ON app_versions (platform);

-- Seed default initial records if table is empty
INSERT INTO app_versions (platform, min_version, latest_version, force_update, update_title, update_message, store_url, maintenance_mode, maintenance_message)
VALUES 
    ('android', '1.0.0', '1.0.0', false, 'App Update Available', 'A new version of Ranniti is available. Update now to enjoy the latest features and security enhancements.', 'https://play.google.com/store/apps/details?id=com.ranniti.app', false, 'Ranniti is currently undergoing scheduled maintenance. Please check back shortly.'),
    ('ios', '1.0.0', '1.0.0', false, 'App Update Available', 'A new version of Ranniti is available. Update now to enjoy the latest features and security enhancements.', 'https://apps.apple.com/app/id6400000000', false, 'Ranniti is currently undergoing scheduled maintenance. Please check back shortly.')
ON CONFLICT (platform) DO NOTHING;
