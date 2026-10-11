# `tenant_dashboard_stats` Table Specification

Pre-aggregated rollup cache storing campaign operational metrics, party sentiment distributions, age cohort pyramids, and 14-day registration velocity for sub-5ms dashboard reads on high-volume voter datasets.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `tenant_db_name` | `VARCHAR(100)` | No | - | Unique isolated tenant database identifier |
| `total_voters` | `INT` | No | `0` | Total registered voters in the constituency |
| `total_booths` | `INT` | No | `0` | Total polling booths configured |
| `assigned_booths_count` | `INT` | No | `0` | Polling booths with assigned cadre / mapped voters |
| `total_volunteers` | `INT` | No | `0` | Active field volunteers and cadre workers |
| `gender_breakdown` | `JSONB` | No | `{"male": 0, "female": 0, "other": 0}` | Pre-aggregated gender counts |
| `party_breakdown` | `JSONB` | No | `[]` | Political party sentiment and preference counts |
| `age_cohorts` | `JSONB` | No | `{"age_18_25": 0, ...}` | Age cohort buckets (18-25, 26-35, 36-50, 51-65, 65+) |
| `registration_velocity` | `JSONB` | No | `[]` | Bounded 14-day daily voter registration counts |
| `ac_breakdown` | `JSONB` | No | `[]` | Assembly Constituency voter distribution |
| `booth_coverage_by_role` | `JSONB` | No | `[]` | Booth coverage breakdown across volunteer cadre roles |
| `last_synced_at` | `TIMESTAMPTZ` | No | `NOW()` | Timestamp of last metric recalculation |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Record update timestamp |

---

## ⚡ Index & Constraint Specifications

| Index / Constraint Name | Type | Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `tenant_dashboard_stats_pkey` | `Primary Key` | `id` | Unique identifier |
| `idx_tenant_dashboard_stats_tenant_db` | `Index` | `tenant_db_name` | Instant sub-millisecond tenant lookup |
