# Database Schema & File-by-File Documentation Sync Rule

Whenever any database schema, table structure, column type, constraint, migration SQL (`src/database/migrations/*`), or index is added, altered, or deleted in the codebase:

## MANDATORY File-by-File Rules for Antigravity:
1. **Save Documentation Per Table File**: Each table MUST have its own dedicated documentation file under `backend/docs/database/tables/<table_name>.md`.
2. **Update Individual Table File**: When modifying a table (e.g. `voters`), Antigravity MUST immediately edit or create `backend/docs/database/tables/voters.md`.
3. **Update Master Index**: Ensure the new or modified table file is linked in `backend/docs/database/schema.md`.
4. **Keep Code and Files Synchronized**: Never leave migration files or query builders out of sync with `backend/docs/database/tables/*.md`.
