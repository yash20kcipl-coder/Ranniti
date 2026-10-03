# `booths` Table Specification

Master table for polling booths under Wards and Assembly Constituencies. Every polling booth is strictly assigned to an electoral ward.

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `ac_id` | `UUID` | No | *None* | Foreign Key referencing `assembly_constituencies(id)` ON DELETE CASCADE |
| `ward_id` | `UUID` | No / Linked | *None* | Foreign Key referencing `wards(id)` ON DELETE SET NULL (Mandatory Electoral Ward / Prabhag assignment) |
| `booth_number` | `INTEGER` | No | *None* | Booth number within AC |
| `name` | `VARCHAR(255)` | No | *None* | Polling booth name |
| `location_building` | `TEXT` | Yes | `NULL` | Building/Location details |
| `total_voters` | `INTEGER` | Yes | `0` | Registered voter count |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `booths_pkey` | `B-Tree (Unique)` | `id` | Primary Key constraint |
| `unq_booth_ac_number` | `B-Tree (Unique)` | `(ac_id, booth_number)` | Unique constraint per AC booth numbering |
| `idx_booths_ac_id` | `B-Tree` | `ac_id` | Fast constituency booths lookup |
| `idx_booths_ward_id` | `B-Tree` | `ward_id` | Fast lookup of booths located inside a ward |
