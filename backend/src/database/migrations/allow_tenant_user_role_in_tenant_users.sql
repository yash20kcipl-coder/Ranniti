-- Migration: Drop restrictive role check in tenant_users table so Tenant Web Portal Users and custom roles are allowed
DO $$
BEGIN
    ALTER TABLE tenant_users DROP CONSTRAINT IF EXISTS tenant_users_role_check;
    ALTER TABLE tenant_users ALTER COLUMN role TYPE VARCHAR(50);
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
