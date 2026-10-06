-- Migration: Track user-synced device contacts to matched voters
CREATE TABLE IF NOT EXISTS user_synced_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    voter_id UUID NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_synced_contacts_unique UNIQUE (user_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_user_synced_contacts_user_id ON user_synced_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_synced_contacts_voter_id ON user_synced_contacts(voter_id);
