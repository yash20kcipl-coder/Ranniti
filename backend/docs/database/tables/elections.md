# `elections` Table Specification

Election master entity storing multi-tier elections (Assembly, Parliamentary, Municipal, Panchayat) with active/default campaign toggles, polling and counting dates, voter snapshots, and status tracking.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `name` | `VARCHAR(150)` | No | None | Election title (e.g. "Maharashtra Assembly 2024") |
| `election_code` | `VARCHAR(50)` | Yes | `NULL` | Short identifier code (e.g. `VS-2024`, `LS-2024`) |
| `election_type` | `VARCHAR(50)` | No | `'ASSEMBLY'` | Type constraint: `ASSEMBLY`, `PARLIAMENTARY`, `MUNICIPAL_CORP`, `ZILLA_PARISHAD`, `PANCHAYAT_SAMITI`, `GRAM_PANCHAYAT`, `OTHER` |
| `election_date` | `DATE` | No | None | Scheduled election polling date |
| `counting_date` | `DATE` | Yes | `NULL` | Scheduled counting / results date |
| `state_id` | `UUID` | Yes | `NULL` | Foreign Key -> `states(id)` (optional geographic scope) |
| `pc_id` | `UUID` | Yes | `NULL` | Foreign Key -> `parliamentary_constituencies(id)` |
| `ac_id` | `UUID` | Yes | `NULL` | Foreign Key -> `assembly_constituencies(id)` |
| `is_active` | `BOOLEAN` | No | `true` | Active campaign flag |
| `is_default` | `BOOLEAN` | No | `false` | Default active election for voter turnout and live dashboard |
| `status` | `VARCHAR(20)` | No | `'UPCOMING'` | Status constraint: `UPCOMING`, `ACTIVE`, `COMPLETED`, `ARCHIVED` |
| `total_voters_snapshot` | `INT` | Yes | `0` | Snapshot of registered electorate count |
| `target_votes` | `INT` | Yes | `0` | Campaign winning target votes |
| `description` | `TEXT` | Yes | `NULL` | Detailed notes or manifesto objectives |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Update timestamp |

---

## ⚡ Index & Constraint Specifications

| Index / Constraint Name | Type | Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `elections_pkey` | `Primary Key` | `id` | Unique identifier |
| `idx_elections_status` | `B-Tree` | `status` | Rapid filtering by election lifecycle state |
| `idx_elections_ac_id` | `B-Tree` | `ac_id` | Constituency-scoped election retrieval |
| `idx_elections_is_default` | `B-Tree` | `is_default` | Fast resolution of active campaign election |
| `idx_elections_election_date` | `B-Tree` | `election_date` | Chronological ordering and upcoming timeline |
