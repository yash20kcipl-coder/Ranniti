# `states` Table Specification

Master table for storing state entities across the nation.

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `name` | `VARCHAR(100)` | No | *None* | Full State Name (Unique) |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

## Indexes & Constraints

* **`states_pkey`**: Primary key on `(id)`
* **`unq_state_name`**: Unique key on `(name)`
* **`uq_states_lower_name`**: Case-insensitive functional unique index on `(LOWER(TRIM(name)))`

