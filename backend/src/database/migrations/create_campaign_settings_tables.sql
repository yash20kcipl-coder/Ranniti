-- Up Migration: Campaign Settings & WhatsApp Templates
CREATE TABLE IF NOT EXISTS campaign_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Push Notification Credentials & Delivery
    fcm_project_id VARCHAR(100),
    fcm_client_email VARCHAR(255),
    fcm_private_key TEXT,
    fcm_server_key TEXT,
    apns_team_id VARCHAR(50),
    apns_key_id VARCHAR(50),
    apns_bundle_id VARCHAR(100),
    apns_auth_key TEXT,
    push_triggers JSONB NOT NULL DEFAULT '{
        "dailyBriefing": true,
        "briefingTime": "07:00",
        "surveyMilestones": true,
        "pollDayTurnout": true,
        "urgentBroadcasts": true,
        "quietHoursEnabled": true,
        "quietHoursStart": "22:00",
        "quietHoursEnd": "06:30"
    }'::jsonb,
    -- WhatsApp Meta Cloud API Configuration
    whatsapp_waba_id VARCHAR(100),
    whatsapp_phone_number_id VARCHAR(100),
    whatsapp_access_token TEXT,
    whatsapp_webhook_verify_token VARCHAR(100),
    whatsapp_quality_rating VARCHAR(30) DEFAULT 'GREEN',
    whatsapp_daily_limit VARCHAR(30) DEFAULT '10K',
    -- Campaign & Candidate Profile
    candidate_name VARCHAR(200),
    party_name VARCHAR(100),
    party_symbol_url TEXT,
    candidate_photo_url TEXT,
    polling_date DATE,
    election_type VARCHAR(50) DEFAULT 'Assembly',
    -- Field Worker App Rules
    field_rules JSONB NOT NULL DEFAULT '{
        "geofencingEnabled": true,
        "geofenceRadiusMeters": 200,
        "offlineSyncAllowed": true,
        "mandatoryMobile": false,
        "allowPhotoCapture": true
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meta_template_id VARCHAR(100),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'UTILITY' CHECK (category IN ('UTILITY', 'MARKETING', 'AUTHENTICATION')),
    language VARCHAR(20) NOT NULL DEFAULT 'hi',
    header_type VARCHAR(20) NOT NULL DEFAULT 'NONE' CHECK (header_type IN ('NONE', 'TEXT', 'IMAGE', 'DOCUMENT', 'VIDEO')),
    header_content TEXT,
    body_text TEXT NOT NULL,
    footer_text TEXT,
    buttons JSONB NOT NULL DEFAULT '[]'::jsonb,
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    meta_status VARCHAR(30) NOT NULL DEFAULT 'APPROVED' CHECK (meta_status IN ('APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DRAFT')),
    meta_rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_whatsapp_templates_name_lang UNIQUE (name, language)
);

-- Indexes for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_templates_name_lang ON whatsapp_templates(name, language);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(meta_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_templates(category);
