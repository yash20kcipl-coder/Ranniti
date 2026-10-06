# `tenants` Table Specification

Dedicated standalone entity table representing tenant organizations, their primary administrator login credentials, assigned geographical constituencies (PCs/ACs), and tenant database provisioning lifecycle.

> **Note:** Replaces the legacy dual-table pattern (`admin_users` where `role = 'tenant_admin'` + `tenant_assignments`). Tenants are standalone entities and are **not** stored in `admin_users`.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `name` | `VARCHAR(255)` | No | *None* | Administrator / Campaign Lead full name |
| `email` | `VARCHAR(255)` | No | *None* | Unique login email address (case-insensitive indexed) |
| `password_hash` | `VARCHAR(255)` | No | *None* | Bcrypt hashed login password |
| `mobile` | `VARCHAR(15)` | Yes | `NULL` | Contact phone / mobile number |
| `avatar` | `VARCHAR(500)` | Yes | `NULL` | Profile avatar image file path or URL |
| `organization_name` | `VARCHAR(255)` | No | *None* | Organization / Political Party Campaign Office Name |
| `tenant_db_name` | `VARCHAR(150)` | No | *None* | Dedicated PostgreSQL tenant database name (e.g. `ranniti_tenant_mumbai_3421`) |
| `pc_ids` | `UUID[]` | No | `'{}'` | Array of assigned Parliamentary Constituency UUIDs |
| `ac_ids` | `UUID[]` | No | `'{}'` | Array of assigned Assembly Constituency UUIDs |
| `tenant_role_id` | `UUID` | Yes | `NULL` | Foreign key referencing `tenant_roles(id)` (ON DELETE SET NULL) |
| `status` | `VARCHAR(30)` | No | `'pending'` | Lifecycle status check: `pending`, `provisioning`, `active`, `failed`, `suspended` |
| `provisioning_progress` | `INT` | No | `0` | Provisioning progress percentage (0 to 100) |
| `total_voters_copied` | `INT` | No | `0` | Number of voter records copied from master to tenant database |
| `current_step` | `VARCHAR(100)` | No | `''` | Current provisioning step description (e.g. `Creating Database`, `Copying Voters (2,500 / 10,000)`) |
| `error_message` | `TEXT` | Yes | `NULL` | Error details if provisioning failed |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Record update timestamp |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns / Expression | Purpose |
| :--- | :--- | :--- | :--- |
| `tenants_pkey` | `B-Tree (Unique)` | `id` | Enforce primary key uniqueness |
| `tenants_email_key` | `B-Tree (Unique)` | `email` | Enforce email address uniqueness |
| `tenants_tenant_db_name_key` | `B-Tree (Unique)` | `tenant_db_name` | Enforce tenant database name uniqueness |
| `idx_tenants_email` | `B-Tree` | `LOWER(email)` | Fast case-insensitive tenant authentication lookups |
| `idx_tenants_status` | `B-Tree` | `status` | Fast filtering by tenant provisioning/account status |
| `idx_tenants_db_name` | `B-Tree` | `tenant_db_name` | Fast lookup during sync dispatch and tenant connection routing |
| `idx_tenants_mobile` | `B-Tree` | `mobile` | Fast lookup by mobile number |
| `idx_tenants_role_id` | `B-Tree` | `tenant_role_id` | Fast join lookups for tenant subscription / role tier |
