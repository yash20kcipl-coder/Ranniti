-- Up Migration: Tenants Table (Dedicated Tenant Organization Accounts)
-- Replaces the dual admin_users (tenant_admin rows) + tenant_assignments pattern.
-- Tenants are standalone entities and must NOT be stored in admin_users.
CREATE TABLE IF NOT EXISTS tenants (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  VARCHAR(255) NOT NULL,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    password_hash         VARCHAR(255) NOT NULL,
    mobile                VARCHAR(15),
    avatar                VARCHAR(500),
    organization_name     VARCHAR(255) NOT NULL,
    tenant_db_name        VARCHAR(150) NOT NULL UNIQUE,
    pc_ids                UUID[] NOT NULL DEFAULT '{}',
    ac_ids                UUID[] NOT NULL DEFAULT '{}',
    tenant_role_id        UUID REFERENCES tenant_roles(id) ON DELETE SET NULL,
    status                VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'provisioning', 'active', 'failed', 'suspended')),
    provisioning_progress INT NOT NULL DEFAULT 0 CHECK (provisioning_progress BETWEEN 0 AND 100),
    total_voters_copied   INT NOT NULL DEFAULT 0,
    current_step          VARCHAR(100) NOT NULL DEFAULT '',
    error_message         TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_email    ON tenants (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_tenants_status   ON tenants (status);
CREATE INDEX IF NOT EXISTS idx_tenants_db_name  ON tenants (tenant_db_name);
CREATE INDEX IF NOT EXISTS idx_tenants_mobile   ON tenants (mobile);
CREATE INDEX IF NOT EXISTS idx_tenants_role_id  ON tenants (tenant_role_id);

-- Down Migration
-- DROP TABLE IF EXISTS tenants;
