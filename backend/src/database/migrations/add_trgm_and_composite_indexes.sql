-- Up Migration
-- Enable PostgreSQL Trigram Extension for sub-10ms fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Composite B-Tree Index for multi-column dropdown filters
CREATE INDEX IF NOT EXISTS idx_voters_constituency_booth_gender 
ON voters (assembly_constituency, booth_number, gender);

-- GIN Trigram Indexes for instant search on Name and EPIC Number
CREATE INDEX IF NOT EXISTS idx_voters_name_trgm ON voters USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_voters_epic_trgm ON voters USING gin (epic_number gin_trgm_ops);

-- Partial Index for unvoted voters
CREATE INDEX IF NOT EXISTS idx_voters_unvoted 
ON voters (assembly_constituency, booth_number) 
WHERE is_voted = false;

-- Down Migration
-- DROP INDEX IF EXISTS idx_voters_unvoted;
-- DROP INDEX IF EXISTS idx_voters_epic_trgm;
-- DROP INDEX IF EXISTS idx_voters_name_trgm;
-- DROP INDEX IF EXISTS idx_voters_constituency_booth_gender;
