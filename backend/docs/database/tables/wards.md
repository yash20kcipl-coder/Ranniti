# `wards` Table Specification

Master table for electoral wards / prabhags under Assembly Constituencies.

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `ac_id` | `UUID` | No | *None* | Foreign Key referencing `assembly_constituencies(id)` ON DELETE CASCADE |
| `ward_number` | `INTEGER` | No | *None* | Ward number within the AC |
| `name` | `VARCHAR(255)` | No | *None* | Electoral Ward / Prabhag name |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `wards_pkey` | `B-Tree (Unique)` | `id` | Primary Key constraint |
| `unq_ward_ac_number` | `B-Tree (Unique)` | `(ac_id, ward_number)` | Unique constraint per AC ward numbering |
| `idx_wards_ac_id` | `B-Tree` | `ac_id` | Fast constituency wards lookup |
