# PostgreSQL Database Creation & Scale Architecture Plan

This document outlines the master creation plan, indexing strategy, data partitioning strategy, and migration management for the Ranniti Voter Analytics backend.

---

## 🎯 Architectural Goals

1. **High Throughput Data Ingestion**: Support streaming batch imports of **100,000+ (1 Lakh+) voter records** in under 1 second.
2. **Sub-50ms Multi-Filter Queries**: Return filtered voter datasets instantly across millions of rows using composite and GIN trigram indexes.
3. **Strict Schema Versioning**: Zero manual SQL execution in production; all schema changes versioned via `node-pg-migrate`.

---

## 🏗️ Table Creation & Indexing Blueprint

### Step 1: PostgreSQL Extensions
- Enable `pg_trgm` extension for trigram-based fuzzy string search (`ILIKE` replacements).

### Step 2: Core Table Schemas
- `voters`: Core entity table with UUID primary keys and JSONB documents storage.

### Step 3: Performance Indexing Strategy
- **Composite B-Tree Indexes**: Created on high-cardinality filtering combinations (`assembly_constituency`, `booth_number`, `gender`).
- **GIN Trigram Indexes**: Created on `name` and `epic_number` using `gin_trgm_ops`.
- **Partial Indexes**: Created for high-frequency queries like unvoted voters (`WHERE is_voted = false`).

---

## 🔄 Migration & Documentation Sync Rules

1. Every schema change must be created as a versioned migration under `src/database/migrations/`.
2. Any table or column addition, alteration, or index modification **MUST** be reflected in `backend/docs/database/schema.md`.
