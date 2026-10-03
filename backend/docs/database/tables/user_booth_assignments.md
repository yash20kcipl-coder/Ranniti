# `user_booth_assignments` Table Specification

Junction table mapping system users (leaders, sub-leaders, supporters) to assigned polling booths.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `UUID` | No | *None* | Foreign key to `admin_users(id)` ON DELETE CASCADE |
| `booth_id` | `UUID` | No | *None* | Foreign key to `booths(id)` ON DELETE CASCADE |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Record creation timestamp |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns / Expression | Purpose |
| :--- | :--- | :--- | :--- |
| `user_booth_assignments_user_booth_key` | `B-Tree (Unique)` | `(user_id, booth_id)` | Enforce unique booth mapping per user |
| `idx_user_booth_assignments_user_id` | `B-Tree` | `user_id` | Fast lookup of booths assigned to a user |
| `idx_user_booth_assignments_booth_id` | `B-Tree` | `booth_id` | Fast lookup of users assigned to a booth |
