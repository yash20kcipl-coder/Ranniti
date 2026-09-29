# `booths` Table Specification

Master table for polling booths.

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `ac_id` | `UUID` | No | *None* | Foreign Key referencing `assembly_constituencies(id)` |
| `block_id` | `UUID` | Yes | `NULL` | Foreign Key referencing `blocks(id)` |
| `booth_number` | `INTEGER` | No | *None* | Booth number within AC |
| `name` | `VARCHAR(255)` | No | *None* | Polling booth name |
| `location_building` | `TEXT` | Yes | `NULL` | Building/Location details |
| `total_voters` | `INTEGER` | Yes | `0` | Registered voter count |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |
