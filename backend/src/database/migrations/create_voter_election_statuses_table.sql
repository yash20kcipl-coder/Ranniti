-- Migration: Create voter_election_statuses table
-- Description: Stores election-wise voter turnout, polling-day telemetry, and slip distribution decoupled from core voter demographics.

CREATE TABLE IF NOT EXISTS voter_election_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    booth_id UUID REFERENCES booths(id) ON DELETE SET NULL,
    has_voted BOOLEAN NOT NULL DEFAULT false,
    voted_at TIMESTAMPTZ,
    marked_by_user_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_voter_election UNIQUE (election_id, voter_id)
);

-- Covering Index for instant Voter Directory pagination and turnout retrieval (<2ms)
CREATE INDEX IF NOT EXISTS idx_ves_covering_lookup 
    ON voter_election_statuses(election_id, voter_id) 
    INCLUDE (has_voted, voted_at, booth_id);

-- Partial Index: Only indexes marked votes for live hourly turnout spikes
CREATE INDEX IF NOT EXISTS idx_ves_voted_hourly 
    ON voter_election_statuses(election_id, voted_at) 
    WHERE has_voted = true;

-- Composite Booth Index for booth-level turnout filtering
CREATE INDEX IF NOT EXISTS idx_ves_booth_voted 
    ON voter_election_statuses(election_id, booth_id, has_voted);

-- Voter-centric Index for historical voter profile lookups across elections
CREATE INDEX IF NOT EXISTS idx_ves_voter_id 
    ON voter_election_statuses(voter_id);
