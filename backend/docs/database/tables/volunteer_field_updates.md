# `volunteer_field_updates` Table Specification

Audit and gamification entity storing field-level updates made by volunteers when enriching voter records during door-to-door surveys.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `volunteer_id` | `UUID` | No | - | Foreign Key / reference to volunteer/user ID |
| `voter_id` | `UUID` | No | - | Foreign Key / reference to updated voter ID |
| `booth_id` | `UUID` | Yes | `NULL` | Foreign Key / reference to voter booth ID |
| `field_name` | `VARCHAR(50)` | No | - | Name of enriched field (e.g., `mobile_no`, `party_id`) |
| `old_value` | `TEXT` | Yes | `NULL` | Previous field value |
| `new_value` | `TEXT` | Yes | `NULL` | Enriched new value |
| `points_awarded` | `INT` | No | `0` | Points credited to volunteer based on campaign rules |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Timestamp of field update |

---

## ⚡ Index & Constraint Specifications

| Index / Constraint Name | Type | Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `volunteer_field_updates_pkey` | `Primary Key` | `id` | Unique row identifier |
| `idx_vfu_volunteer_created` | `B-Tree` | `volunteer_id, created_at DESC` | Volunteer activity history and scoring rollups |
| `idx_vfu_booth_created` | `B-Tree` | `booth_id, created_at DESC` | Territorial survey progress and booth audits |
| `idx_vfu_voter` | `B-Tree` | `voter_id` | Voter change history queries |
| `idx_vfu_field_name` | `B-Tree` | `field_name` | Field-type distribution metrics |
