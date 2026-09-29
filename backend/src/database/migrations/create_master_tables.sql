-- Up Migration: Master Tables Creation

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

-- 5. Blocks / Mandals / Wards Master
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ac_id UUID NOT NULL REFERENCES assembly_constituencies(id) ON DELETE CASCADE,
    code VARCHAR(20),
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Polling Booths Master
CREATE TABLE IF NOT EXISTS booths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ac_id UUID NOT NULL REFERENCES assembly_constituencies(id) ON DELETE CASCADE,
    block_id UUID REFERENCES blocks(id) ON DELETE SET NULL,
    booth_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    location_building TEXT,
    total_voters INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_booth_ac_number UNIQUE (ac_id, booth_number)
);

-- 7. Religions Master
CREATE TABLE IF NOT EXISTS religions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Castes & Categories Master
CREATE TABLE IF NOT EXISTS castes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('General', 'OBC', 'SC', 'ST', 'Other')),
    religion_id UUID REFERENCES religions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Political Parties Master
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    abbreviation VARCHAR(20) NOT NULL,
    symbol_logo VARCHAR(500),
    alliance VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Organizations / Clients Master
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    ac_id UUID REFERENCES assembly_constituencies(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Down Migration
-- DROP TABLE IF EXISTS organizations;
-- DROP TABLE IF EXISTS parties;
-- DROP TABLE IF EXISTS castes;
-- DROP TABLE IF EXISTS religions;
-- DROP TABLE IF EXISTS booths;
-- DROP TABLE IF EXISTS blocks;
-- DROP TABLE IF EXISTS assembly_constituencies;
-- DROP TABLE IF EXISTS parliamentary_constituencies;
-- DROP TABLE IF EXISTS districts;
-- DROP TABLE IF EXISTS states;
