# Database Table: `tenant_roles`

## Description
Stores Tier 1 Super Admin Tenant Feature Packages. Controls maximum web tab, master sub-tab, and mobile core module feature ceilings assigned to tenant accounts.

## Schema Definition

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique package identifier |
| `role_name` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Package / Role name |
| `description` | `TEXT` | `NULL` | Detailed description of package scope |
| `allowed_tabs` | `JSONB` | `NOT NULL DEFAULT ...` | JSON ceiling object (`web_tabs`, `master_sub_tabs`, `mobile_modules`) |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Package availability status |
| `is_default` | `BOOLEAN` | `NOT NULL DEFAULT false` | Flag indicating default role package auto-assigned on tenant creation |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Update timestamp |
