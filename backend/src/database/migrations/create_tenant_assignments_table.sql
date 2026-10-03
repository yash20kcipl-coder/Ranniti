-- Up Migration: Tenant Assignments Table
-- Tracks each tenant admin's assigned PCs, ACs and their dedicated database provisioning status
CREATE TABLE IF NOT EXISTS tenant_assignments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  organization_name     VARCHAR(255) NOT NULL,
  tenant_db_name        VARCHAR(150) NOT NULL UNIQUE,
  pc_ids                UUID[] DEFAULT '{}',
  ac_ids                UUID[] DEFAULT '{}',
  status                VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'provisioning', 'active', 'failed', 'suspended')),
  provisioning_progress INT NOT NULL DEFAULT 0 CHECK (provisioning_progress BETWEEN 0 AND 100),
  total_voters_copied   INT NOT NULL DEFAULT 0,
  current_step          VARCHAR(100) NOT NULL DEFAULT '',
  error_message         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_assignments_user_id ON tenant_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_assignments_status  ON tenant_assignments(status);

-- Down Migration
-- DROP TABLE IF EXISTS tenant_assignments;
