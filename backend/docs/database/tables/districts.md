# `districts` Table Specification

Master table for storing administrative districts within states.

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `state_id` | `UUID` | No | *None* | Foreign Key referencing `states(id)` ON DELETE CASCADE |
| `name` | `VARCHAR(100)` | No | *None* | District Name |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |
