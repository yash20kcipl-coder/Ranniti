# Table: `app_versions`

## Description
Stores configuration rules for mobile application versions, store URLs, force update thresholds, update titles/messages, and maintenance mode status for both Android and iOS platforms. Managed via the Super Admin Portal.

## Schema Definition

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Unique version identifier |
| `platform` | `VARCHAR(20)` | `NOT NULL, UNIQUE` | None | Target mobile platform (`android` or `ios`) |
| `min_version` | `VARCHAR(20)` | `NOT NULL` | `'1.0.0'` | Minimum required app version. Apps on lower versions trigger a hard force update. |
| `latest_version` | `VARCHAR(20)` | `NOT NULL` | `'1.0.0'` | Latest available app version. Apps on lower versions show a recommended soft update prompt. |
| `force_update` | `BOOLEAN` | `NOT NULL` | `false` | Global force update override flag for this platform. |
| `update_title` | `VARCHAR(255)` | `NULLABLE` | `'App Update Available'` | Custom update title displayed in mobile update modal. |
| `update_message` | `TEXT` | `NULLABLE` | Standard release note | Custom update message / release notes displayed in mobile app. |
| `store_url` | `VARCHAR(500)` | `NOT NULL` | `''` | Deep link / Store URL (Google Play Store or Apple App Store URL). |
| `maintenance_mode` | `BOOLEAN` | `NOT NULL` | `false` | Emergency maintenance mode toggle. Blocks mobile app usage with maintenance message. |
| `maintenance_message` | `TEXT` | `NULLABLE` | Standard maintenance note | Custom maintenance mode notice. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Timestamp when record was created |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Timestamp when record was last updated |

## Indexes
- `idx_app_versions_platform`: Index on `platform` (`platform`) for fast lookups.

## Sample Queries

```sql
-- Fetch app version configuration for mobile app
SELECT * FROM app_versions WHERE platform = 'android';

-- Update version requirement from Super Admin
UPDATE app_versions 
SET min_version = '2.4.0', 
    latest_version = '2.5.0', 
    force_update = true, 
    updated_at = NOW() 
WHERE platform = 'android';
```
