-- Migration: create_master_voter_sync_queue_table.sql
-- Queue table in Master DB to manage asynchronous voter replication to tenant databases with retry support.

CREATE TABLE IF NOT EXISTS master_voter_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL DEFAULT 'voter_sync',
  source VARCHAR(50) NOT NULL DEFAULT 'bulk_import',
  batch_id VARCHAR(100),
  ac_id UUID NOT NULL REFERENCES assembly_constituencies(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_db_name VARCHAR(100) NOT NULL,
  total_voters INT NOT NULL DEFAULT 0,
  synced_voters INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 5,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_master_voter_sync_queue_status_retry 
  ON master_voter_sync_queue (status, next_retry_at) 
  WHERE status IN ('pending', 'retrying');

CREATE INDEX IF NOT EXISTS idx_master_voter_sync_queue_tenant 
  ON master_voter_sync_queue (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_master_voter_sync_queue_ac 
  ON master_voter_sync_queue (ac_id);
