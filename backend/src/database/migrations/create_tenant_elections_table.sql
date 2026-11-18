-- Migration: Create tenant_elections junction table
-- Description: Stores Super Admin assignments of master elections to tenant organizations.

CREATE TABLE IF NOT EXISTS tenant_elections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    is_default BOOLEAN NOT NULL DEFAULT false,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    CONSTRAINT unq_tenant_election UNIQUE (tenant_id, election_id)
);

CREATE INDEX IF NOT EXISTS idx_te_tenant_id ON tenant_elections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_te_election_id ON tenant_elections(election_id);
CREATE INDEX IF NOT EXISTS idx_te_is_default ON tenant_elections(tenant_id, is_default) WHERE is_default = true;
