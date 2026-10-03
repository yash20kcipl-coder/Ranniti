-- Up Migration: Admin Users & Authentication Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'tenant_admin', 'pc_leader', 'ac_leader', 'leader', 'sub_leader', 'supporter', 'deo', 'analyst', 'user')),
    role_name VARCHAR(100),
    mobile VARCHAR(15),
    avatar VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    tenant_db_name VARCHAR(150),
    parent_leader_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    assigned_ac_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast authentication, role filtering, and hierarchy lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users (role);
CREATE INDEX IF NOT EXISTS idx_admin_users_tenant_db_name ON admin_users (tenant_db_name);
CREATE INDEX IF NOT EXISTS idx_admin_users_parent_leader_id ON admin_users (parent_leader_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_assigned_ac_id ON admin_users (assigned_ac_id);

-- Junction Table: User Booth Assignments (Leaders / Sub-Leaders / Supporters to Polling Booths)
CREATE TABLE IF NOT EXISTS user_booth_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_user_booth_assignment UNIQUE (user_id, booth_id)
);

CREATE INDEX IF NOT EXISTS idx_user_booth_assignments_user_id ON user_booth_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_booth_assignments_booth_id ON user_booth_assignments(booth_id);

-- Down Migration
-- DROP TABLE IF EXISTS user_booth_assignments;
-- DROP TABLE IF EXISTS admin_users;
