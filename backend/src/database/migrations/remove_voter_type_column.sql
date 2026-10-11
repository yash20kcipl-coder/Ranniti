-- Migration: Remove voter_type column from voters table
-- Description: Voter political stance and preference is strictly recorded via party_id (parties table).
-- voter_type is obsolete and removed.

DROP INDEX IF EXISTS idx_voters_voter_type;

ALTER TABLE voters DROP COLUMN IF EXISTS voter_type;
