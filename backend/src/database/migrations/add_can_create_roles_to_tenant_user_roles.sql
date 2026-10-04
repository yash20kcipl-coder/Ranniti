-- Migration: add_can_create_roles_to_tenant_user_roles.sql
-- Description: Adds configurable user delegation permissions (can_create_roles) to tenant_user_roles table

ALTER TABLE tenant_user_roles 
ADD COLUMN IF NOT EXISTS can_create_roles JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Populate default delegation rights for core roles
UPDATE tenant_user_roles 
SET can_create_roles = '["ac_leader", "sub_leader", "supporter"]'::jsonb,
    accessible_tabs = jsonb_set(accessible_tabs, '{webTabs}', '[]'::jsonb, true)
WHERE role_key = 'pc_leader';

UPDATE tenant_user_roles 
SET can_create_roles = '["sub_leader", "supporter"]'::jsonb,
    accessible_tabs = jsonb_set(accessible_tabs, '{webTabs}', '[]'::jsonb, true)
WHERE role_key = 'ac_leader';

UPDATE tenant_user_roles 
SET can_create_roles = '["supporter"]'::jsonb,
    accessible_tabs = jsonb_set(accessible_tabs, '{webTabs}', '[]'::jsonb, true)
WHERE role_key = 'sub_leader';

UPDATE tenant_user_roles 
SET can_create_roles = '[]'::jsonb,
    accessible_tabs = jsonb_set(accessible_tabs, '{webTabs}', '[]'::jsonb, true)
WHERE role_key = 'supporter';
