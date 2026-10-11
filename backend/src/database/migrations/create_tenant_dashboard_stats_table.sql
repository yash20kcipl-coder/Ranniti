-- Migration: Create tenant_dashboard_stats rollup table
-- Description: Pre-aggregated high-scale metrics cache for instant (<5ms) tenant campaign dashboard loading.

CREATE TABLE IF NOT EXISTS tenant_dashboard_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_db_name VARCHAR(100) UNIQUE NOT NULL,
    total_voters INT DEFAULT 0,
    total_booths INT DEFAULT 0,
    assigned_booths_count INT DEFAULT 0,
    total_volunteers INT DEFAULT 0,
    gender_breakdown JSONB NOT NULL DEFAULT '{"male": 0, "female": 0, "other": 0}'::jsonb,
    party_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    age_cohorts JSONB NOT NULL DEFAULT '{"age_18_25": 0, "age_26_35": 0, "age_36_50": 0, "age_51_65": 0, "age_65_plus": 0, "age_unknown": 0}'::jsonb,
    registration_velocity JSONB NOT NULL DEFAULT '[]'::jsonb,
    ac_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_dashboard_stats_tenant_db ON tenant_dashboard_stats(tenant_db_name);
