# `organizations` Table Specification

Master table for organization clients, campaign instances, and tenant accounts.

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `name` | `VARCHAR(200)` | No | *None* | Organization / Campaign Name |
| `code` | `VARCHAR(50)` | No | *None* | Unique Organization Code (e.g., `org_ac01_2026`) |
| `ac_id` | `UUID` | Yes | `NULL` | Foreign Key referencing `assembly_constituencies(id)` |
| `status` | `VARCHAR(20)` | Yes | `'active'` | Status check: `active`, `inactive`, `suspended` |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |
