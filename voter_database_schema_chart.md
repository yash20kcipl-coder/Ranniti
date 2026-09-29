# 🗄️ PostgreSQL Database Schema Architecture (1.46B+ Scale)

> [!NOTE]
> **Database Architecture Goal**: Scale to **1.46 Billion+ voter records** using PostgreSQL Table Partitioning by State (`state_id`), composite B-Tree indexes for sub-millisecond search, and isolated Campaign overlays (`campaign_id`).

---

## 📐 1. Full Database Entity Relationship Diagram (ERD)

![PostgreSQL Database ERD Diagram](file:///Users/mac-yash/.gemini/antigravity-ide/brain/c14f18b0-b2bd-4efd-9e9e-a4bd17a4394c/voter_database_schema.svg)

---

## 📜 2. Complete SQL DDL Table Specifications

### A. Central Master Tables

```sql
-- 1. Assembly Constituencies Table
CREATE TABLE IF NOT EXISTS assembly_constituencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pc_id UUID NOT NULL REFERENCES parliamentary_constituencies(id) ON DELETE CASCADE,
    district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
    ac_number INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Polling Booths Table
CREATE TABLE IF NOT EXISTS polling_booths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ac_id UUID NOT NULL REFERENCES assembly_constituencies(id) ON DELETE CASCADE,
    booth_number INT NOT NULL,
    name VARCHAR(250) NOT NULL,
    location_building VARCHAR(250),
    total_voters INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Partitioned Master Voters Table (1.46B Scale)
CREATE TABLE IF NOT EXISTS voters (
    id UUID DEFAULT gen_random_uuid(),
    epic_no VARCHAR(20) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    relative_name VARCHAR(200),
    gender VARCHAR(1) CHECK (gender IN ('M', 'F', 'O')),
    age INT CHECK (age >= 18 AND age <= 120),
    dob DATE,
    state_id UUID NOT NULL REFERENCES states(id),
    district_id UUID REFERENCES districts(id),
    pc_id UUID NOT NULL REFERENCES parliamentary_constituencies(id),
    ac_id UUID NOT NULL REFERENCES assembly_constituencies(id),
    booth_id UUID NOT NULL REFERENCES polling_booths(id),
    part_no INT NOT NULL,
    serial_no INT NOT NULL,
    house_no VARCHAR(100),
    religion_id UUID REFERENCES religions(id),
    caste_id UUID REFERENCES castes(id),
    category VARCHAR(20) CHECK (category IN ('General', 'OBC', 'SC', 'ST', 'Other')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, state_id)
) PARTITION BY LIST (state_id);
```

### B. Campaign & Multi-Tenant Isolated Tables

```sql
-- 4. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    ac_id UUID REFERENCES assembly_constituencies(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Campaign Private Voter Overlay Table
CREATE TABLE IF NOT EXISTS campaign_voter_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL,
    mobile_no VARCHAR(15),
    whatsapp_no VARCHAR(15),
    voter_disposition VARCHAR(20) CHECK (voter_disposition IN ('favorable', 'neutral', 'opposed', 'floating')),
    is_family_head BOOLEAN DEFAULT FALSE,
    family_head_id UUID REFERENCES voters(id) ON DELETE SET NULL,
    cadre_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_campaign_voter UNIQUE (campaign_id, voter_id)
);
```

---

## ⚡ 3. High-Performance Indexes for Fast Search

```sql
-- Fast EPIC / Voter ID Lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_voters_epic_no ON voters (epic_no, state_id);

-- Fast Booth & Serial Number Sorting (ECI Electoral Roll View)
CREATE INDEX IF NOT EXISTS idx_voters_booth_serial ON voters (booth_id, serial_no);

-- Fast Name Search Trigram Index (GIN)
CREATE INDEX IF NOT EXISTS idx_voters_name_trgm ON voters USING gin (full_name gin_trgm_ops);

-- Fast Campaign Query Index
CREATE INDEX IF NOT EXISTS idx_camp_voter_lookup ON campaign_voter_details (campaign_id, voter_id);
```

---

## 📊 4. Database Partitioning & Data Isolation Strategy

> [!IMPORTANT]
> 1. **Partitioning Strategy**: The `voters` master table is partitioned by `state_id` into 36 state tables (`voters_mh`, `voters_up`, `voters_dl`, etc.). This keeps table size below 40M rows per partition.
> 2. **Tenant Privacy**: `campaign_voter_details` enforces `CONSTRAINT uk_campaign_voter UNIQUE(campaign_id, voter_id)`. Every API query applies `WHERE campaign_id = req.user.campaignId`.
