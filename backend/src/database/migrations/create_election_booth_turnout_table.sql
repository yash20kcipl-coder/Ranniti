-- Migration: Create election_booth_turnout table
-- Description: Real-time pre-aggregated counter cache per booth per election to eliminate slow COUNT(*) on 300k+ voter datasets during live voting.

CREATE TABLE IF NOT EXISTS election_booth_turnout (
    election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
    total_voters INT NOT NULL DEFAULT 0,
    voted_count INT NOT NULL DEFAULT 0,
    male_voted_count INT NOT NULL DEFAULT 0,
    female_voted_count INT NOT NULL DEFAULT 0,
    other_voted_count INT NOT NULL DEFAULT 0,
    last_voted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (election_id, booth_id)
);

CREATE INDEX IF NOT EXISTS idx_ebt_election_id 
    ON election_booth_turnout(election_id);
