-- Migration: Tenant Users & Booth Assignments Table for Tenant DBs
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('pc_leader', 'ac_leader', 'leader', 'sub_leader', 'supporter')),
    role_name VARCHAR(100),
    mobile VARCHAR(15),
    avatar VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    tenant_db_name VARCHAR(150),
    parent_leader_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    assigned_ac_id UUID,
    accessible_tabs JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users (email);
CREATE INDEX IF NOT EXISTS idx_tenant_users_mobile ON tenant_users (mobile);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON tenant_users (role);
CREATE INDEX IF NOT EXISTS idx_tenant_users_parent_leader_id ON tenant_users (parent_leader_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_assigned_ac_id ON tenant_users (assigned_ac_id);

-- Junction Table: User Booth Assignments (Leaders / Sub-Leaders / Supporters to Polling Booths in Tenant DB)
CREATE TABLE IF NOT EXISTS user_booth_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
    booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_user_booth_assignment UNIQUE (user_id, booth_id)
);

CREATE INDEX IF NOT EXISTS idx_user_booth_assignments_user_id ON user_booth_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_booth_assignments_booth_id ON user_booth_assignments(booth_id);
