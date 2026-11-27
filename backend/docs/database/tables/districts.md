# `districts` Table Specification

Master table for storing administrative districts within states.

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `state_id` | `UUID` | No | *None* | Foreign Key referencing `states(id)` ON DELETE CASCADE |
| `name` | `VARCHAR(100)` | No | *None* | District Name |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

## Indexes & Constraints

* **`districts_pkey`**: Primary key on `(id)`
* **`unq_district_state_name`**: Composite unique on `(state_id, name)`
* **`uq_districts_state_lower_name`**: Case-insensitive functional unique index on `(state_id, LOWER(TRIM(name)))` preventing casing duplicates
* **`idx_districts_state_id`**: B-tree index on `(state_id)`

