# `parliamentary_constituencies` Table Specification

Master reference table for Lok Sabha Parliamentary Constituencies (PCs).

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `state_id` | `UUID` | No | *None* | Foreign Key referencing `states(id)` |
| `pc_number` | `INTEGER` | No | *None* | Official Lok Sabha PC Number |
| `name` | `VARCHAR(255)` | No | *None* | PC Name |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

## Indexes
- `idx_pcs_state_id`: `B-Tree (state_id)`
- `idx_pcs_state_pc_num`: `B-Tree (state_id, pc_number)`
