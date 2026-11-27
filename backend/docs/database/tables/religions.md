# `religions` Table Specification

Master table for storing religious demographics.

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `name` | `VARCHAR(50)` | No | *None* | Unique Religion Name (e.g. `Hinduism`, `Islam`, `Sikhism`) |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

## Indexes & Constraints

* **`religions_pkey`**: Primary key on `(id)`
* **`religions_name_key`**: Unique key on `(name)`
* **`uq_religions_lower_name`**: Case-insensitive functional unique index on `(LOWER(TRIM(name)))`

