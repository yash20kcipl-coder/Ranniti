# `assembly_constituencies` Table Specification

Master reference table for Vidhan Sabha Assembly Constituencies (ACs).

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `pc_id` | `UUID` | No | *None* | Foreign Key referencing `parliamentary_constituencies(id)` |
| `district_id` | `UUID` | Yes | `NULL` | Foreign Key referencing `districts(id)` |
| `ac_number` | `INTEGER` | No | *None* | Official Vidhan Sabha AC Number |
| `name` | `VARCHAR(255)` | No | *None* | AC Name |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

## Indexes
- `idx_acs_pc_id`: `B-Tree (pc_id)`
- `idx_acs_district_id`: `B-Tree (district_id)`
- `idx_acs_ac_number`: `B-Tree (ac_number)`
