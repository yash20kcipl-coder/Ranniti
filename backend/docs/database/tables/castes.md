# `castes` Table Specification

Master table for storing caste & social category classifications.

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `name` | `VARCHAR(100)` | No | *None* | Unique Caste Name |
| `category` | `VARCHAR(20)` | No | *None* | Category Check: `General`, `OBC`, `SC`, `ST`, `Other` |
| `religion_id` | `UUID` | Yes | `NULL` | Foreign Key referencing `religions(id)` |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |
