# `parties` Table Specification

Master table for storing recognized political parties & campaign symbols.

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `name` | `VARCHAR(150)` | No | *None* | Unique Party Name (e.g. `Bharatiya Janata Party`) |
| `abbreviation` | `VARCHAR(20)` | No | *None* | Party Abbreviation Code (e.g. `BJP`, `INC`, `AAP`) |
| `symbol_logo` | `VARCHAR(500)` | Yes | `NULL` | Public relative file URL or icon path |
| `alliance` | `VARCHAR(100)` | Yes | `NULL` | Political Coalition / Alliance Name (e.g. `NDA`, `INDIA`, `MHA`) |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |
