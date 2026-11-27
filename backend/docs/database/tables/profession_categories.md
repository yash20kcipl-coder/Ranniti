# `profession_categories` Table Specification

Master table for storing broad profession and occupational categories (e.g. `Government`, `Healthcare & Medical`, `Agriculture & Farming`, `Education`, `Business & Trade`).

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `name` | `VARCHAR(100)` | No | *None* | Unique Category Name |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

## Indexes & Constraints

* **`profession_categories_pkey`**: Primary key on `(id)`
* **`profession_categories_name_key`**: Unique key on `(name)`
* **`uq_profession_categories_lower_name`**: Case-insensitive functional unique index on `(LOWER(TRIM(name)))`
