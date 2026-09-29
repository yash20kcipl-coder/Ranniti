# Database Migration Naming Convention Rule

When creating database migration files under `backend/src/database/migrations/`:

## MANDATORY Rules for Antigravity:
1. **NO Numeric / Timestamp Prefixes**: Never add numeric, timestamp, or sequential prefixes (e.g. `170000000..._` or `001_`) to migration filenames.
2. **Descriptive `snake_case` Filenames**: Name migration files directly using clear descriptive `snake_case` names (e.g. `create_voters_table.sql`, `create_master_tables.sql`, `add_trgm_and_composite_indexes.sql`).
