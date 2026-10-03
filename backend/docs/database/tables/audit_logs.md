# Table Documentation: `audit_logs`

## Description
Security audit trail table located in the Master Database. Records administrative actions, role changes, tenant provisioning events, and security access logs.

## Columns

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique log identifier |
| `user_id` | `UUID` | `NULL` | ID of user performing action |
| `tenant_id` | `UUID` | `NULL` | Target tenant ID (if applicable) |
| `action` | `VARCHAR(100)` | `NOT NULL` | Descriptive action identifier |
| `entity_type` | `VARCHAR(50)` | `NULL` | Affected entity type |
| `entity_id` | `UUID` | `NULL` | Affected entity primary key |
| `details` | `JSONB` | `NULL` | Additional context or state diffs |
| `ip_address` | `VARCHAR(45)` | `NULL` | Client IP address |
| `user_agent` | `TEXT` | `NULL` | Client User-Agent string |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Event timestamp |
