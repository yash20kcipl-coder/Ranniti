# `user_synced_contacts` Table Specification

Junction table tracking device contacts synced by mobile app users to matched voter records in tenant databases.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `UUID` | No | *None* | ID of the mobile user who synced the contact |
| `voter_id` | `UUID` | No | *None* | ID of the matched voter in `voters(id)` |
| `synced_at` | `TIMESTAMPTZ` | No | `NOW()` | Timestamp when the contact was synced |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns / Expression | Purpose |
| :--- | :--- | :--- | :--- |
| `user_synced_contacts_unique` | `B-Tree (Unique)` | `(user_id, voter_id)` | Prevent duplicate sync mappings per user and voter |
| `idx_user_synced_contacts_user_id` | `B-Tree` | `user_id` | Fast lookup/count of voters synced by a specific user |
| `idx_user_synced_contacts_voter_id` | `B-Tree` | `voter_id` | Fast lookup of sync state for a voter |
