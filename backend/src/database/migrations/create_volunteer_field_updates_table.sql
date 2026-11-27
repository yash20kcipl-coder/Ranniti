-- Up Migration: Create volunteer_field_updates table
-- Description: Records every voter field update made by volunteers, tracking old vs new values and awarded points for gamification.

CREATE TABLE IF NOT EXISTS volunteer_field_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL,
    voter_id UUID NOT NULL,
    booth_id UUID,
    field_name VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    points_awarded INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast volunteer performance rollups, booth aggregations, and timeline feeds
CREATE INDEX IF NOT EXISTS idx_vfu_volunteer_created 
    ON volunteer_field_updates (volunteer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vfu_booth_created 
    ON volunteer_field_updates (booth_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vfu_voter 
    ON volunteer_field_updates (voter_id);

CREATE INDEX IF NOT EXISTS idx_vfu_field_name 
    ON volunteer_field_updates (field_name);
