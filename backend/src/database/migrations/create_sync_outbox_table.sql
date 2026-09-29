-- Up Migration: Transactional Outbox Pattern for Multi-Tenant Bi-Directional Synchronization

CREATE TABLE IF NOT EXISTS sync_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Index for rapid fetching of pending sync events by queue worker
CREATE INDEX IF NOT EXISTS idx_sync_outbox_status_created ON sync_outbox (status, created_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_sync_outbox_tenant_id ON sync_outbox (tenant_id);

-- Down Migration
-- DROP TABLE IF EXISTS sync_outbox;
