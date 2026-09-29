-- Migration: Create voters master table
-- Description: Stores core voter records, ECI identification, contact details, demographics, and campaign overlays.

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DROP TABLE IF EXISTS voters CASCADE;

CREATE TABLE voters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    epic_no VARCHAR(30) UNIQUE NOT NULL,
    state_id UUID REFERENCES states(id) ON DELETE SET NULL,
    district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
    pc_id UUID REFERENCES parliamentary_constituencies(id) ON DELETE SET NULL,
    ac_id UUID REFERENCES assembly_constituencies(id) ON DELETE SET NULL,
    booth_id UUID REFERENCES booths(id) ON DELETE SET NULL,
    serial_no INT,
    section_no INT,
    house_no VARCHAR(100),
    
    -- Names (Dual Language: Local & English)
    first_name VARCHAR(150),
    eng_first_name VARCHAR(150),
    middle_name VARCHAR(150),
    eng_middle_name VARCHAR(150),
    surname VARCHAR(150),
    eng_surname VARCHAR(150),
    
    -- Personal & Identification
    gender VARCHAR(10),
    dob DATE,
    age INT,
    mobile_no VARCHAR(15),
    email VARCHAR(150),
    aadhaar_no VARCHAR(20),
    pan_no VARCHAR(20),
    
    -- Profession & Demographics
    profession_type VARCHAR(100),
    profession VARCHAR(100),
    religion_id UUID REFERENCES religions(id) ON DELETE SET NULL,
    caste_id UUID REFERENCES castes(id) ON DELETE SET NULL,
    subcaste_name VARCHAR(150),
    voter_type VARCHAR(50) DEFAULT 'Voter',
    
    -- Extended Profile & Campaign Overlays
    status VARCHAR(20) DEFAULT 'Active',
    is_dead BOOLEAN DEFAULT FALSE,
    blood_group VARCHAR(10),
    avatar VARCHAR(255),
    taluka VARCHAR(150),
    village VARCHAR(150),
    full_address TEXT,
    voter_address TEXT,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    family_influencer_id UUID REFERENCES voters(id) ON DELETE SET NULL,
    social_influencer_id UUID REFERENCES voters(id) ON DELETE SET NULL,

    -- Organization / Campaign Tenant Overlay
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Sub-Millisecond Search & Roll Navigation
CREATE UNIQUE INDEX IF NOT EXISTS idx_voters_epic_no ON voters(epic_no);
CREATE INDEX IF NOT EXISTS idx_voters_booth_serial ON voters(booth_id, serial_no);
CREATE INDEX IF NOT EXISTS idx_voters_ac_id ON voters(ac_id);
CREATE INDEX IF NOT EXISTS idx_voters_organization_id ON voters(organization_id);
CREATE INDEX IF NOT EXISTS idx_voters_religion_id ON voters(religion_id);
CREATE INDEX IF NOT EXISTS idx_voters_caste_id ON voters(caste_id);
CREATE INDEX IF NOT EXISTS idx_voters_status ON voters(status);
CREATE INDEX IF NOT EXISTS idx_voters_is_dead ON voters(is_dead);
CREATE INDEX IF NOT EXISTS idx_voters_party_id ON voters(party_id);
CREATE INDEX IF NOT EXISTS idx_voters_blood_group ON voters(blood_group);
CREATE INDEX IF NOT EXISTS idx_voters_booth_house ON voters(booth_id, house_no);
CREATE INDEX IF NOT EXISTS idx_voters_family_inf ON voters(family_influencer_id);
CREATE INDEX IF NOT EXISTS idx_voters_social_inf ON voters(social_influencer_id);

-- GIN Trigram Search Index for English Name Lookup
CREATE INDEX IF NOT EXISTS idx_voters_eng_fname_trgm ON voters USING gin(eng_first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_voters_eng_sname_trgm ON voters USING gin(eng_surname gin_trgm_ops);
