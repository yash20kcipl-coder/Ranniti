# Table Documentation: `bulk_upload_demos`

## Description
Dedicated sandbox and benchmark testing table in the Master Database. Used by Super Admins to test high-volume bulk Excel imports (1,000 to 100,000+ records), measure duration and throughput (records/sec), verify HTML/XSS sanitization, test duplicate conflict handling, and inspect failed row tracking without corrupting production tables.

## Columns

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique demo record identifier |
| `test_batch_id` | `VARCHAR(100)` | `NOT NULL DEFAULT 'DEFAULT_TEST_BATCH'` | Identifier for test run batch to allow isolated benchmarking and targeted purging |
| `row_number` | `INTEGER` | `NULL` | Original spreadsheet row index (`__rowIndex`) from uploaded Excel file |
| `epic_number` | `VARCHAR(50)` | `NULL` | Voter/EPIC card ID used to test duplicate detection and conflict strategies |
| `full_name` | `VARCHAR(255)` | `NOT NULL` | Full name of record; verifies HTML tag stripping and text sanitization |
| `relative_name` | `VARCHAR(255)` | `NULL` | Father / Husband / Guardian relative name |
| `gender` | `VARCHAR(20)` | `NULL` | Demographic gender value (`Male`, `Female`, `Other`) |
| `age` | `INTEGER` | `NULL` | Numeric age value |
| `mobile_number` | `VARCHAR(20)` | `NULL` | Indian mobile number; verifies phone format normalization |
| `email` | `VARCHAR(255)` | `NULL` | Email address |
| `booth_number` | `VARCHAR(50)` | `NULL` | Booth number or code |
| `section_name` | `VARCHAR(255)` | `NULL` | Section or neighborhood designation |
| `address` | `TEXT` | `NULL` | Full address text |
| `status` | `VARCHAR(50)` | `DEFAULT 'active'` | Status flag |
| `raw_metadata` | `JSONB` | `DEFAULT '{}'` | Raw JSON payload or custom spreadsheet columns |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record update timestamp |

## Constraints
- `CONSTRAINT unq_bulk_demos_batch_epic UNIQUE (test_batch_id, epic_number)`: Ensures unique EPIC numbers per test batch and allows benchmarking ON CONFLICT strategies.

## Indexes

| Index Name | Columns | Description |
|---|---|---|
| `idx_bulk_upload_demos_batch_id` | `(test_batch_id)` | Fast filtering and targeted teardown per benchmark test batch |
| `idx_bulk_upload_demos_epic` | `(test_batch_id, epic_number)` | Duplicate checking and conflict resolution within test batches |
| `idx_bulk_upload_demos_mobile` | `(mobile_number)` | Fast lookup and duplicate checking for phone numbers |
| `idx_bulk_upload_demos_created_at` | `(created_at DESC)` | Chronological ordering for dashboard previews |
