# `voter_election_statuses` Table Specification

Stores election-wise voter turnout, polling-day telemetry, and slip distribution decoupled from core voter demographic profiles. Supports historical election comparisons without voter data duplication.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `election_id` | `UUID` | No | None | Foreign Key -> `elections(id)` ON DELETE CASCADE |
| `voter_id` | `UUID` | No | None | Foreign Key -> `voters(id)` ON DELETE CASCADE |
| `booth_id` | `UUID` | Yes | `NULL` | Foreign Key -> `booths(id)` ON DELETE SET NULL |
| `has_voted` | `BOOLEAN` | No | `false` | Whether voter cast vote on polling day |
| `voted_at` | `TIMESTAMPTZ` | Yes | `NULL` | Precise timestamp when vote was recorded |
| `marked_by_user_id` | `UUID` | Yes | `NULL` | Foreign Key -> `tenant_users(id)` (auditing field/booth agent) |
| `notes` | `TEXT` | Yes | `NULL` | Polling day observer notes or remarks |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

---

## ⚡ Index & Constraint Specifications

| Index / Constraint Name | Type | Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `voter_election_statuses_pkey` | `Primary Key` | `id` | Unique identifier |
| `unq_voter_election` | `Unique Constraint` | `(election_id, voter_id)` | Guarantees exactly one record per voter per election |
| `idx_ves_covering_lookup` | `Covering Index` | `(election_id, voter_id) INCLUDE (has_voted, voted_at, booth_id)` | Sub-millisecond voter directory listing without table heap access |
| `idx_ves_voted_hourly` | `Partial Index` | `(election_id, voted_at) WHERE has_voted = true` | High-speed hourly turnout surge calculation without scanning unvoted records |
| `idx_ves_booth_voted` | `Composite Index` | `(election_id, booth_id, has_voted)` | Instant booth-level turnout filtering and Get-Out-The-Vote (GOTV) lists |
| `idx_ves_voter_id` | `B-Tree` | `voter_id` | Historical election turnout timeline lookup per voter |
