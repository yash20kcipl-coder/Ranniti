-- Migration: Standardize volunteer role labels across tenant_users and tenant_user_roles
-- Description: Normalizes role_name to single standard labels (PC Leader, AC Leader, Sub-Leader, Volunteer) without altering seed data.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_users') THEN
    UPDATE tenant_users
    SET role_name = CASE role
      WHEN 'pc_leader' THEN 'PC Leader'
      WHEN 'ac_leader' THEN 'AC Leader'
      WHEN 'sub_leader' THEN 'Sub-Leader'
      WHEN 'supporter' THEN 'Volunteer'
      ELSE role_name
    END
    WHERE role IN ('pc_leader', 'ac_leader', 'sub_leader', 'supporter')
      AND (
        role_name IS DISTINCT FROM CASE role
          WHEN 'pc_leader' THEN 'PC Leader'
          WHEN 'ac_leader' THEN 'AC Leader'
          WHEN 'sub_leader' THEN 'Sub-Leader'
          WHEN 'supporter' THEN 'Volunteer'
          ELSE role_name
        END
      );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_user_roles') THEN
    UPDATE tenant_user_roles
    SET role_name = CASE role_key
      WHEN 'pc_leader' THEN 'PC Leader'
      WHEN 'ac_leader' THEN 'AC Leader'
      WHEN 'sub_leader' THEN 'Sub-Leader'
      WHEN 'supporter' THEN 'Volunteer'
      ELSE role_name
    END
    WHERE role_key IN ('pc_leader', 'ac_leader', 'sub_leader', 'supporter')
      AND (
        role_name IS DISTINCT FROM CASE role_key
          WHEN 'pc_leader' THEN 'PC Leader'
          WHEN 'ac_leader' THEN 'AC Leader'
          WHEN 'sub_leader' THEN 'Sub-Leader'
          WHEN 'supporter' THEN 'Volunteer'
          ELSE role_name
        END
      );
  END IF;
END $$;
