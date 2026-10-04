-- Up Migration: Canonical Master Tables Creation

-- 1. States Master
CREATE TABLE IF NOT EXISTS states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Districts Master
CREATE TABLE IF NOT EXISTS districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_district_state_name UNIQUE (state_id, name)
);

-- 3. Parliamentary Constituencies (PC) Master
CREATE TABLE IF NOT EXISTS parliamentary_constituencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    pc_number INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_pc_state_number UNIQUE (state_id, pc_number)
);

-- 4. Assembly Constituencies (AC) Master
CREATE TABLE IF NOT EXISTS assembly_constituencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pc_id UUID NOT NULL REFERENCES parliamentary_constituencies(id) ON DELETE CASCADE,
    district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
    ac_number INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_ac_pc_number UNIQUE (pc_id, ac_number)
);

-- 5. Talukas (Tehsils) Master
CREATE TABLE IF NOT EXISTS talukas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_taluka_district_name UNIQUE (district_id, name)
);

-- 6. Villages Master
CREATE TABLE IF NOT EXISTS villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taluka_id UUID NOT NULL REFERENCES talukas(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_village_taluka_name UNIQUE (taluka_id, name)
);

-- 7. Wards (Prabhags) Master
CREATE TABLE IF NOT EXISTS wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ac_id UUID NOT NULL REFERENCES assembly_constituencies(id) ON DELETE CASCADE,
    ward_number INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_ward_ac_number UNIQUE (ac_id, ward_number)
);

-- 8. Polling Booths Master
CREATE TABLE IF NOT EXISTS booths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ac_id UUID NOT NULL REFERENCES assembly_constituencies(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    village_id UUID REFERENCES villages(id) ON DELETE SET NULL,
    booth_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    location_building TEXT,
    total_voters INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_booth_ac_number UNIQUE (ac_id, booth_number)
);

ALTER TABLE booths ADD COLUMN IF NOT EXISTS village_id UUID REFERENCES villages(id) ON DELETE SET NULL;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES wards(id) ON DELETE SET NULL;

-- 9. Religions Master
CREATE TABLE IF NOT EXISTS religions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Castes & Subcastes Master
CREATE TABLE IF NOT EXISTS castes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('General', 'OBC', 'SC', 'ST', 'Other')),
    religion_id UUID REFERENCES religions(id) ON DELETE SET NULL,
    parent_caste_id UUID REFERENCES castes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Political Parties Master
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    abbreviation VARCHAR(20) NOT NULL,
    symbol_logo VARCHAR(500),
    alliance VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Master Table Indexes
CREATE INDEX IF NOT EXISTS idx_districts_state_id ON districts(state_id);
CREATE INDEX IF NOT EXISTS idx_pcs_state_id ON parliamentary_constituencies(state_id);
CREATE INDEX IF NOT EXISTS idx_acs_pc_id ON assembly_constituencies(pc_id);
CREATE INDEX IF NOT EXISTS idx_acs_district_id ON assembly_constituencies(district_id);
CREATE INDEX IF NOT EXISTS idx_talukas_district_id ON talukas(district_id);
CREATE INDEX IF NOT EXISTS idx_villages_taluka_id ON villages(taluka_id);
CREATE INDEX IF NOT EXISTS idx_wards_ac_id ON wards(ac_id);
CREATE INDEX IF NOT EXISTS idx_booths_ac_id ON booths(ac_id);
CREATE INDEX IF NOT EXISTS idx_booths_ward_id ON booths(ward_id);
CREATE INDEX IF NOT EXISTS idx_booths_village_id ON booths(village_id);
CREATE INDEX IF NOT EXISTS idx_castes_religion_id ON castes(religion_id);
CREATE INDEX IF NOT EXISTS idx_castes_parent_caste_id ON castes(parent_caste_id);
