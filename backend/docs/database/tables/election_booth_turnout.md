# `election_booth_turnout` Table Specification

Real-time pre-aggregated counter cache per booth per election. Eliminates slow `COUNT(*)` operations across 300,000+ voter datasets during high-concurrency polling day surges.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `election_id` | `UUID` | No | None | Foreign Key -> `elections(id)` ON DELETE CASCADE |
| `booth_id` | `UUID` | No | None | Foreign Key -> `booths(id)` ON DELETE CASCADE |
| `total_voters` | `INT` | No | `0` | Total registered electorate assigned to this booth |
| `voted_count` | `INT` | No | `0` | Total votes cast in this booth |
| `male_voted_count` | `INT` | No | `0` | Male voters who cast ballot |
| `female_voted_count` | `INT` | No | `0` | Female voters who cast ballot |
| `other_voted_count` | `INT` | No | `0` | Other gender voters who cast ballot |
| `last_voted_at` | `TIMESTAMPTZ` | Yes | `NULL` | Timestamp of latest vote marked |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Timestamp of last counter increment/decrement |

---

## ⚡ Index & Constraint Specifications

| Index / Constraint Name | Type | Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `election_booth_turnout_pkey` | `Primary Key` | `(election_id, booth_id)` | Composite unique booth-election identifier |
| `idx_ebt_election_id` | `B-Tree` | `election_id` | Instant constituency-wide turnout rollup (<5ms) |
