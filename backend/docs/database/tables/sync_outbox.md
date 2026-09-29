# `sync_outbox` Table Specification

Transactional outbox table for storing state mutation events to drive bi-directional asynchronous synchronization between Master DB and isolated Tenant Databases.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Unique outbox event identifier |
| `tenant_id` | `VARCHAR(100)` | No | *None* | Tenant identifier associated with event |
| `aggregate_type` | `VARCHAR(100)` | No | *None* | Entity domain type (e.g. `VOTER`, `BOOTH`) |
| `aggregate_id` | `VARCHAR(100)` | No | *None* | Target entity primary key |
| `event_type` | `VARCHAR(100)` | No | *None* | Mutation event (e.g. `CREATED`, `UPDATED`, `DELETED`) |
| `payload` | `JSONB` | No | *None* | Full serialized event payload |
| `status` | `VARCHAR(20)` | No | `'PENDING'` | Check constraint: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `retry_count` | `INTEGER` | No | `0` | Number of sync delivery retry attempts |
| `error_message` | `TEXT` | Yes | `NULL` | Failure details if status is `FAILED` |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Event enqueued timestamp |
| `processed_at` | `TIMESTAMPTZ` | Yes | `NULL` | Processing completion timestamp |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns / Expression | Purpose |
| :--- | :--- | :--- | :--- |
| `idx_sync_outbox_status_created` | `B-Tree (Partial)` | `(status, created_at) WHERE status = 'PENDING'` | Rapid fetching of pending events for sync queue worker |
| `idx_sync_outbox_tenant_id` | `B-Tree` | `(tenant_id)` | Fast lookup of sync history per tenant |
