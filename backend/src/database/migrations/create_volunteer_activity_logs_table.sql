-- Migration: Create volunteer_activity_logs table
-- Description: Tracks volunteer outreach interactions (phone calls, WhatsApp messages, SMS) for voter analytics.

CREATE TABLE IF NOT EXISTS volunteer_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL,
    voter_id UUID,
    booth_id UUID,
    activity_type VARCHAR(20) NOT NULL, -- 'call', 'whatsapp', 'sms'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_volunteer_activity_logs_perf 
    ON volunteer_activity_logs (volunteer_id, activity_type, created_at);

CREATE INDEX IF NOT EXISTS idx_volunteer_activity_logs_voter 
    ON volunteer_activity_logs (voter_id);

CREATE INDEX IF NOT EXISTS idx_volunteer_activity_logs_booth 
    ON volunteer_activity_logs (booth_id);

CREATE INDEX IF NOT EXISTS idx_volunteer_activity_logs_created_at 
    ON volunteer_activity_logs (created_at DESC);
