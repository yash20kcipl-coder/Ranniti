-- Migration: Drop slip columns from election tables
-- Description: Removes slip_distributed and slips_distributed_count as slip distribution is deprecated.

ALTER TABLE voter_election_statuses
    DROP COLUMN IF EXISTS slip_distributed,
    DROP COLUMN IF EXISTS slip_distributed_at,
    DROP COLUMN IF EXISTS slip_distributed_by;

ALTER TABLE election_booth_turnout
    DROP COLUMN IF EXISTS slips_distributed_count;
