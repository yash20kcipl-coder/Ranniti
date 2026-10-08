# `user_synced_contacts` Table Specification

Junction table tracking device contacts synced by mobile app users to matched voter records in tenant databases.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `UUID` | No | *None* | ID of the mobile user who synced the contact |
| `voter_id` | `UUID` | No | *None* | ID of the matched voter in `voters(id)` |
| `contact_name` | `VARCHAR(150)` | Yes | `NULL` | Device address book contact display name (e.g. Rameshji Kirana) |
| `contact_phone` | `VARCHAR(20)` | Yes | `NULL` | Device address book contact phone number |
| `synced_at` | `TIMESTAMPTZ` | No | `NOW()` | Timestamp when the contact was initially synced |
| `updated_at` | `TIMESTAMPTZ` | Yes | `NOW()` | Timestamp when the synced mapping was last refreshed |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns / Expression | Purpose |
| :--- | :--- | :--- | :--- |
| `user_synced_contacts_unique` | `B-Tree (Unique)` | `(user_id, voter_id)` | Prevent duplicate sync mappings per user and voter |
| `idx_user_synced_contacts_user_id` | `B-Tree` | `user_id` | Fast lookup/count of voters synced by a specific user |
| `idx_user_synced_contacts_voter_id` | `B-Tree` | `voter_id` | Fast lookup of sync state for a voter |
| `idx_user_synced_contacts_user_synced_at` | `B-Tree` | `(user_id, synced_at DESC)` | Fast chronological retrieval and pagination of user's synced contacts |

