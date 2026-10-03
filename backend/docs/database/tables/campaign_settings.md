# `campaign_settings` Table Specification

Configuration entity storing organization/campaign settings including Push Notification credentials (FCM, APNs), event trigger toggles, WhatsApp Meta Cloud API configuration, campaign/candidate profile, and field app rules.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `fcm_project_id` | `VARCHAR(100)` | Yes | `NULL` | Firebase Cloud Messaging Project ID |
| `fcm_client_email` | `VARCHAR(255)` | Yes | `NULL` | Firebase service account client email |
| `fcm_private_key` | `TEXT` | Yes | `NULL` | Firebase service account private key |
| `fcm_server_key` | `TEXT` | Yes | `NULL` | Legacy FCM Server Key (optional fallback) |
| `apns_team_id` | `VARCHAR(50)` | Yes | `NULL` | Apple Developer Team ID |
| `apns_key_id` | `VARCHAR(50)` | Yes | `NULL` | Apple APNs Key ID |
| `apns_bundle_id` | `VARCHAR(100)` | Yes | `NULL` | iOS App Bundle ID |
| `apns_auth_key` | `TEXT` | Yes | `NULL` | Apple APNs Auth Key (.p8 contents) |
| `push_triggers` | `JSONB` | No | `{"dailyBriefing": true, ...}` | Push notification triggers, quiet hours, briefing times |
| `whatsapp_waba_id` | `VARCHAR(100)` | Yes | `NULL` | WhatsApp Business Account (WABA) ID |
| `whatsapp_phone_number_id` | `VARCHAR(100)` | Yes | `NULL` | Meta WhatsApp Phone Number ID |
| `whatsapp_access_token` | `TEXT` | Yes | `NULL` | Meta System User permanent access token |
| `whatsapp_webhook_verify_token` | `VARCHAR(100)` | Yes | `NULL` | Webhook verification secret token |
| `whatsapp_quality_rating` | `VARCHAR(30)` | Yes | `'GREEN'` | Meta phone number quality score |
| `whatsapp_daily_limit` | `VARCHAR(30)` | Yes | `'10K'` | Current daily tier limit (1K, 10K, 100K) |
| `candidate_name` | `VARCHAR(200)` | Yes | `NULL` | Candidate full name |
| `party_name` | `VARCHAR(100)` | Yes | `NULL` | Campaign political party name |
| `party_symbol_url` | `TEXT` | Yes | `NULL` | Political party symbol logo path |
| `candidate_photo_url` | `TEXT` | Yes | `NULL` | Official candidate photo path |
| `polling_date` | `DATE` | Yes | `NULL` | Scheduled election polling date |
| `election_type` | `VARCHAR(50)` | Yes | `'Assembly'` | Election type (Lok Sabha, Assembly, Municipal) |
| `field_rules` | `JSONB` | No | `{"geofencingEnabled": true, ...}` | Mobile survey rules, GPS geofencing, offline mode |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

---

## ⚡ Index & Constraint Specifications

| Index / Constraint Name | Type | Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `campaign_settings_pkey` | `Primary Key` | `id` | Unique identifier |
