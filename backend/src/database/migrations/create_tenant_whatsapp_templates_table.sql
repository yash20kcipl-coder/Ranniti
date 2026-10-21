-- Migration: Create WhatsApp Templates table in Tenant DB
-- Description: Enables tenant-isolated WhatsApp messaging templates with multi-lingual support, dynamic variable tokens, and approval statuses.

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

CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_templates_name_lang ON whatsapp_templates(name, language);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(meta_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_templates(category);
