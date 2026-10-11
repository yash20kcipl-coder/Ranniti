-- Migration: Tenant Sync Outbox Table for Tenant DBs
CREATE TABLE IF NOT EXISTS tenant_sync_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    payload JSONB NOT NULL,
    origin VARCHAR(20) NOT NULL DEFAULT 'tenant',
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Ensure origin column exists on pre-existing tenant DBs
ALTER TABLE tenant_sync_outbox ADD COLUMN IF NOT EXISTS origin VARCHAR(20) NOT NULL DEFAULT 'tenant';

CREATE INDEX IF NOT EXISTS idx_tenant_sync_outbox_status ON tenant_sync_outbox (status);
CREATE INDEX IF NOT EXISTS idx_tenant_sync_outbox_created_at ON tenant_sync_outbox (created_at);
