-- Migration: Add case-insensitive unique expression indexes for master entities
-- Prevents duplicate casing anomalies across Master and Tenant databases

-- States: Case-insensitive unique name
CREATE UNIQUE INDEX IF NOT EXISTS uq_states_lower_name
ON states (LOWER(TRIM(name)));

-- Districts: Case-insensitive unique name per state
CREATE UNIQUE INDEX IF NOT EXISTS uq_districts_state_lower_name
ON districts (state_id, LOWER(TRIM(name)));

-- Talukas: Case-insensitive unique name per district
CREATE UNIQUE INDEX IF NOT EXISTS uq_talukas_district_lower_name
ON talukas (district_id, LOWER(TRIM(name)));

-- Religions: Case-insensitive unique name
CREATE UNIQUE INDEX IF NOT EXISTS uq_religions_lower_name
ON religions (LOWER(TRIM(name)));

-- Parties: Case-insensitive unique name
CREATE UNIQUE INDEX IF NOT EXISTS uq_parties_lower_name
ON parties (LOWER(TRIM(name)));

-- Parties: Case-insensitive unique abbreviation
CREATE UNIQUE INDEX IF NOT EXISTS uq_parties_lower_abbreviation
ON parties (LOWER(TRIM(abbreviation)))
WHERE abbreviation IS NOT NULL AND TRIM(abbreviation) != '';

-- Villages: Case-insensitive unique name per taluka
CREATE UNIQUE INDEX IF NOT EXISTS uq_villages_taluka_lower_name
ON villages (taluka_id, LOWER(TRIM(name)));

-- Castes: Case-insensitive unique name
CREATE UNIQUE INDEX IF NOT EXISTS uq_castes_lower_name
ON castes (LOWER(TRIM(name)));
