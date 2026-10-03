# `tenant_assignments` Table Specification

Tracks tenant account database provisioning state and geographical constituency scopes (PCs/ACs assigned).

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `UUID` | No | *None* | Foreign key referencing `admin_users(id)` (ON DELETE CASCADE) |
| `organization_name` | `VARCHAR(255)` | No | *None* | Organization / Party Campaign Office Name |
| `tenant_db_name` | `VARCHAR(150)` | No | *None* | Unique name of dedicated tenant database (e.g. `ranniti_tenant_rajesh_3210`) |
| `pc_ids` | `UUID[]` | Yes | `'{}'` | Array of assigned Parliamentary Constituency UUIDs |
| `ac_ids` | `UUID[]` | Yes | `'{}'` | Array of assigned Assembly Constituency UUIDs |
| `status` | `VARCHAR(30)` | No | `'pending'` | Check: `pending`, `provisioning`, `active`, `failed`, `suspended` |
| `provisioning_progress` | `INT` | No | `0` | Provisioning progress percentage (0-100) |
| `total_voters_copied` | `INT` | No | `0` | Number of voter records copied to tenant database |
| `current_step` | `VARCHAR(100)` | No | `''` | Human-readable label of the table/stage currently being processed (e.g. `Syncing Castes`, `Copying Voters (1,200 / 4,800)`) |
| `error_message` | `TEXT` | Yes | `NULL` | Provisioning failure error log |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Record update timestamp |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns / Expression | Purpose |
| :--- | :--- | :--- | :--- |
| `tenant_assignments_pkey` | `B-Tree (Unique)` | `id` | Enforce primary key uniqueness |
| `tenant_assignments_tenant_db_name_key` | `B-Tree (Unique)` | `tenant_db_name` | Enforce tenant database name uniqueness |
| `idx_tenant_assignments_user_id` | `B-Tree` | `user_id` | Fast lookup by user |
| `idx_tenant_assignments_status` | `B-Tree` | `status` | Fast filtering by provisioning status |
