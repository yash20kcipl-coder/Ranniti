-- Migration: Add relation column to voters table
-- Description: Stores voter guardian/family relation (e.g., Father, Husband, Mother, etc.)

ALTER TABLE voters ADD COLUMN IF NOT EXISTS relation VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_voters_relation ON voters(relation);
