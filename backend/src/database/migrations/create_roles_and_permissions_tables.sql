-- Up Migration: Roles and Permissions Tables (Two-Tier Role Matrix)

-- 1. Tier 1: Super Admin Tenant Role Packages
CREATE TABLE IF NOT EXISTS tenant_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name   VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    allowed_tabs JSONB NOT NULL DEFAULT '{
        "web_tabs": ["dashboard", "voter_directory", "master_data"],
        "master_sub_tabs": ["acs", "wards", "booths"],
        "mobile_modules": ["voter_search", "family_tree", "survey"]
    }'::jsonb,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    is_default  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tier 2: Tenant Custom User Roles & Field Permissions
CREATE TABLE IF NOT EXISTS tenant_user_roles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_db_name      VARCHAR(150),
    role_name           VARCHAR(100) NOT NULL,
    role_key            VARCHAR(50) NOT NULL,
    description         TEXT,
    accessible_tabs     JSONB NOT NULL DEFAULT '{
        "web_tabs": ["dashboard", "voter_directory"],
        "master_sub_tabs": ["booths"],
        "mobile_screens": ["voter_search", "survey"]
    }'::jsonb,
    voter_permissions   JSONB NOT NULL DEFAULT '{
        "can_view_voter": true,
        "can_edit_contact": false,
        "can_edit_demographics": false,
        "can_edit_inclination": false,
        "can_edit_voter_status": false,
        "can_manage_family": false,
        "can_export_data": false
    }'::jsonb,
    can_create_roles    JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system_default   BOOLEAN NOT NULL DEFAULT false,
    created_by          UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_tenant_db ON tenant_user_roles(tenant_db_name);
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_key ON tenant_user_roles(role_key);

-- 4. Reference Tenant User Role in admin_users
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS tenant_user_role_id UUID REFERENCES tenant_user_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_admin_users_tenant_user_role_id ON admin_users(tenant_user_role_id);
