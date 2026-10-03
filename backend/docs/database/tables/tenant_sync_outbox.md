# Table Documentation: `tenant_sync_outbox`

## Description
Transactional outbox queue table located in individual Tenant Databases. Stores failed or asynchronous sync operations from Tenant DB back to the Master DB for retry worker processing.

## Columns

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique identifier for outbox entry |
| `entity_type` | `VARCHAR(50)` | `NOT NULL` | Entity type ('ac', 'ward', 'booth') |
| `entity_id` | `UUID` | `NOT NULL` | Entity ID being synchronized |
| `action` | `VARCHAR(20)` | `NOT NULL` | Operation action ('CREATE', 'UPDATE', 'DELETE') |
| `payload` | `JSONB` | `NOT NULL` | Full record data payload for sync |
| `status` | `VARCHAR(20)` | `DEFAULT 'pending'` | Sync status ('pending', 'synced', 'failed') |
| `retry_count` | `INT` | `DEFAULT 0` | Number of retry attempts made by background worker |
| `error_message` | `TEXT` | `NULL` | Error details from last failed sync attempt |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Outbox entry creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Last status update timestamp |
