# `professions` Table Specification

Master table for storing specific professions and occupations classified under a `profession_category` (e.g. `Doctor`, `Nurse`, `High School Teacher`, `Civil Engineer`, `Farmer / Cultivator`).

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `category_id` | `UUID` | No | *None* | Foreign Key referencing `profession_categories(id)` ON DELETE CASCADE |
| `name` | `VARCHAR(150)` | No | *None* | Specific Profession Name |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

## Indexes & Constraints

* **`professions_pkey`**: Primary key on `(id)`
* **`unq_profession_category_name`**: Composite unique constraint on `(category_id, name)`
* **`uq_professions_category_lower_name`**: Case-insensitive composite unique index on `(category_id, LOWER(TRIM(name)))`
* **`idx_professions_category_id`**: B-tree index on `(category_id)`
