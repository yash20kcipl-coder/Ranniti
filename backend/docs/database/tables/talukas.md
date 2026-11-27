# `talukas` Table Specification

Master table for storing administrative talukas (tehsils/sub-districts) within districts.

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `district_id` | `UUID` | No | *None* | Foreign Key referencing `districts(id)` ON DELETE CASCADE |
| `name` | `VARCHAR(150)` | No | *None* | Taluka Name |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

## Indexes & Constraints

* **`talukas_pkey`**: Primary key on `(id)`
* **`unq_taluka_district_name`**: Composite unique on `(district_id, name)`
* **`uq_talukas_district_lower_name`**: Case-insensitive functional unique index on `(district_id, LOWER(TRIM(name)))`

