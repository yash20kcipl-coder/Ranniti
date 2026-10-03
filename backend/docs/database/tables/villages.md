# `villages` Table Specification

Master table for storing administrative and revenue villages within talukas. Functions independently for voter residential and demographic address mapping.

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `taluka_id` | `UUID` | No | *None* | Foreign Key referencing `talukas(id)` ON DELETE CASCADE |
| `name` | `VARCHAR(150)` | No | *None* | Village Name |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `villages_pkey` | `B-Tree (Unique)` | `id` | Primary Key constraint |
| `unq_village_taluka_name` | `B-Tree (Unique)` | `(taluka_id, name)` | Unique constraint per taluka village naming |
| `idx_villages_taluka_id` | `B-Tree` | `taluka_id` | Fast taluka villages lookup |
