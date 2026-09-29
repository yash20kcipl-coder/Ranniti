-- Migration: Add B-Tree Indexes on Master Foreign Keys and Composite Sort Columns

-- 1. Districts Indexes
CREATE INDEX IF NOT EXISTS idx_districts_state_id ON districts (state_id);
CREATE INDEX IF NOT EXISTS idx_districts_state_name ON districts (state_id, name);

-- 2. Parliamentary Constituencies (PC) Indexes
CREATE INDEX IF NOT EXISTS idx_pcs_state_id ON parliamentary_constituencies (state_id);
CREATE INDEX IF NOT EXISTS idx_pcs_state_pc_num ON parliamentary_constituencies (state_id, pc_number);

-- 3. Assembly Constituencies (AC) Indexes
CREATE INDEX IF NOT EXISTS idx_acs_pc_id ON assembly_constituencies (pc_id);
CREATE INDEX IF NOT EXISTS idx_acs_district_id ON assembly_constituencies (district_id);
CREATE INDEX IF NOT EXISTS idx_acs_ac_number ON assembly_constituencies (ac_number);

-- 4. Polling Booths Indexes
CREATE INDEX IF NOT EXISTS idx_booths_ac_id ON booths (ac_id);
CREATE INDEX IF NOT EXISTS idx_booths_ac_booth_num ON booths (ac_id, booth_number);

-- 5. Castes Indexes
CREATE INDEX IF NOT EXISTS idx_castes_religion_id ON castes (religion_id);

-- 6. Organizations Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_ac_id ON organizations (ac_id);
