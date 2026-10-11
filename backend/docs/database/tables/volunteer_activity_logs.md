# `volunteer_activity_logs` Table Specification

Telemetry log table recording volunteer interactions and outreach activities (Phone calls, WhatsApp chats, and SMS messages) initiated from the mobile application.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `volunteer_id` | `UUID` | No | *None* | ID of the volunteer/field worker who initiated the action |
| `voter_id` | `UUID` | Yes | `NULL` | ID of the targeted voter |
| `booth_id` | `UUID` | Yes | `NULL` | Polling booth assigned or associated with the voter |
| `activity_type` | `VARCHAR(20)` | No | *None* | Outreach communication channel (`'call'`, `'whatsapp'`, `'sms'`) |
| `metadata` | `JSONB` | Yes | `'{}'::jsonb` | Additional context (e.g. template used, phone number, duration) |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Action initiation timestamp |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns / Expression | Purpose |
| :--- | :--- | :--- | :--- |
| `idx_volunteer_activity_logs_perf` | `B-Tree` | `(volunteer_id, activity_type, created_at)` | Fast aggregation of volunteer actions by channel and time window |
| `idx_volunteer_activity_logs_voter` | `B-Tree` | `voter_id` | Quick lookup of voter engagement and interaction history |
| `idx_volunteer_activity_logs_booth` | `B-Tree` | `booth_id` | Fast booth-level outreach calculation |
| `idx_volunteer_activity_logs_created_at` | `B-Tree` | `created_at DESC` | Efficient chronological sorting and filtering for recent activity streams |
