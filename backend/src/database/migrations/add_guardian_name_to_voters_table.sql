-- Migration: Add guardian_name column to voters table
ALTER TABLE voters ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255);

-- Create index for fast search and lookup by guardian_name
CREATE INDEX IF NOT EXISTS idx_voters_guardian_name ON voters(guardian_name);
