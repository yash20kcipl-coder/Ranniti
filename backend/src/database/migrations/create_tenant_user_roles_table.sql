-- Migration: Create tenant user roles table for tenant campaign databases
-- Description: Stores campaign volunteer roles, screen access, and field permissions locally per tenant

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
    created_by          UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_key ON tenant_user_roles(role_key);
