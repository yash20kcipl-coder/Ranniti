-- Migration: Add parent_caste_id column and index to castes table for subcaste support
ALTER TABLE castes 
ADD COLUMN IF NOT EXISTS parent_caste_id UUID REFERENCES castes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_castes_parent_caste_id ON castes(parent_caste_id);
