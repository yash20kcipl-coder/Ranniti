# Database Table: `tenant_user_roles`

## Description
Stores Tier 2 Tenant Custom User Roles created by Tenant Admins for field leaders (PC/AC Leaders, Sub-Leaders, Supporters, DEOs). Controls accessible web tabs, mobile screens, and granular voter data editing rights.

## Schema Definition

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique user role identifier |
| `tenant_db_name` | `VARCHAR(150)` | `NULL` | Tenant database identifier |
| `role_name` | `VARCHAR(100)` | `NOT NULL` | User role display title |
| `role_key` | `VARCHAR(50)` | `NOT NULL` | Category key (`pc_leader`, `ac_leader`, `sub_leader`, `supporter`, `deo`, `analyst`, `custom`) |
| `description` | `TEXT` | `NULL` | Detailed scope description |
| `accessible_tabs` | `JSONB` | `NOT NULL DEFAULT ...` | JSON tab subset (`web_tabs`, `master_sub_tabs`, `mobile_screens`) |
| `voter_permissions` | `JSONB` | `NOT NULL DEFAULT ...` | JSON voter editing permissions (`can_view_voter`, `can_edit_contact`, `can_edit_demographics`, `can_edit_inclination`, `can_edit_voter_status`, `can_manage_family`, `can_export_data`) |
| `is_system_default` | `BOOLEAN` | `NOT NULL DEFAULT false` | Flag indicating default role |
| `created_by` | `UUID` | `REFERENCES admin_users(id)` | User who created the role |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Update timestamp |

## Indexes
- `idx_tenant_user_roles_tenant_db` ON `tenant_user_roles(tenant_db_name)`
- `idx_tenant_user_roles_key` ON `tenant_user_roles(role_key)`
