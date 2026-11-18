# `tenant_elections` Table Specification

Junction table managing Super Admin assignments of master election entities to tenant organizations, controlling active campaign defaults and tenant-level visibility.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `tenant_id` | `UUID` | No | None | Foreign Key -> `tenants(id)` ON DELETE CASCADE |
| `election_id` | `UUID` | No | None | Foreign Key -> `elections(id)` ON DELETE CASCADE |
| `is_default` | `BOOLEAN` | No | `false` | Whether this election is the active default campaign for this tenant |
| `assigned_at` | `TIMESTAMPTZ` | No | `NOW()` | Timestamp when the election was assigned |
| `assigned_by` | `UUID` | Yes | `NULL` | Foreign Key -> `admin_users(id)` ON DELETE SET NULL (Super Admin who assigned) |

---

## ⚡ Index & Constraint Specifications

| Index / Constraint Name | Type | Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `tenant_elections_pkey` | `Primary Key` | `id` | Unique record identifier |
| `unq_tenant_election` | `Unique Constraint` | `tenant_id, election_id` | Prevents duplicate assignment of the same election to a tenant |
| `idx_te_tenant_id` | `B-Tree` | `tenant_id` | Fast lookup of all elections assigned to a tenant |
| `idx_te_election_id` | `B-Tree` | `election_id` | Fast lookup of all tenants assigned to an election |
| `idx_te_is_default` | `Partial B-Tree` | `tenant_id, is_default` | Instant lookup of tenant's active default campaign election |
