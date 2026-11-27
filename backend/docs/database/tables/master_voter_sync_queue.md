# Table Documentation: `master_voter_sync_queue`

## Description
Queue table located in the Master Database (`ranniti_db`). Manages asynchronous, non-blocking synchronization of voter datasets from Master DB down into matching Tenant databases with automated exponential backoff retries and SuperAdmin manual retry triggers.

## Columns

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique identifier for sync queue job |
| `job_type` | `VARCHAR(50)` | `NOT NULL DEFAULT 'voter_sync'` | Category of sync job ('voter_sync') |
| `source` | `VARCHAR(50)` | `NOT NULL DEFAULT 'bulk_import'` | Triggering source ('bulk_import', 'manual_sync', 'cli_import') |
| `batch_id` | `VARCHAR(100)` | `NULL` | Optional import batch or upload job identifier |
| `ac_id` | `UUID` | `NOT NULL REFERENCES assembly_constituencies(id) ON DELETE CASCADE` | Assembly Constituency whose voters need synchronization |
| `tenant_id` | `UUID` | `NOT NULL REFERENCES tenants(id) ON DELETE CASCADE` | Target tenant assigned to this Assembly Constituency |
| `tenant_db_name` | `VARCHAR(100)` | `NOT NULL` | Physical database name of target tenant |
| `total_voters` | `INT` | `NOT NULL DEFAULT 0` | Total number of voters in this AC scope |
| `synced_voters` | `INT` | `NOT NULL DEFAULT 0` | Number of voters successfully replicated |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'pending'` | Queue state ('pending', 'processing', 'completed', 'retrying', 'failed') |
| `retry_count` | `INT` | `NOT NULL DEFAULT 0` | Number of automatic retries attempted |
| `max_retries` | `INT` | `NOT NULL DEFAULT 5` | Maximum automatic retry attempts before transitioning to 'failed' |
| `last_error` | `TEXT` | `NULL` | Error details from the most recent failed sync attempt |
| `next_retry_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp when the job becomes eligible for retry poller |
| `started_at` | `TIMESTAMPTZ` | `NULL` | Timestamp when worker began processing |
| `completed_at` | `TIMESTAMPTZ` | `NULL` | Timestamp when replication completed |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Last status update timestamp |

## Indexes

- `idx_master_voter_sync_queue_status_retry`: Partial index on `(status, next_retry_at)` for `pending` and `retrying` states.
- `idx_master_voter_sync_queue_tenant`: Index on `(tenant_id, created_at DESC)`.
- `idx_master_voter_sync_queue_ac`: Index on `ac_id`.
