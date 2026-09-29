-- Migration: Add extended voter profile, address, and influencer fields
-- Description: Adds status, is_dead, blood_group, avatar, taluka, village, full_address, voter_address, party_id, family_influencer_id, and social_influencer_id columns to voters table.

ALTER TABLE voters
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS is_dead BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10),
  ADD COLUMN IF NOT EXISTS avatar VARCHAR(255),
  ADD COLUMN IF NOT EXISTS taluka VARCHAR(150),
  ADD COLUMN IF NOT EXISTS village VARCHAR(150),
  ADD COLUMN IF NOT EXISTS full_address TEXT,
  ADD COLUMN IF NOT EXISTS voter_address TEXT,
  ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS family_influencer_id UUID REFERENCES voters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS social_influencer_id UUID REFERENCES voters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_voters_status ON voters(status);
CREATE INDEX IF NOT EXISTS idx_voters_is_dead ON voters(is_dead);
CREATE INDEX IF NOT EXISTS idx_voters_party_id ON voters(party_id);
CREATE INDEX IF NOT EXISTS idx_voters_blood_group ON voters(blood_group);
CREATE INDEX IF NOT EXISTS idx_voters_booth_house ON voters(booth_id, house_no);
CREATE INDEX IF NOT EXISTS idx_voters_family_inf ON voters(family_influencer_id);
CREATE INDEX IF NOT EXISTS idx_voters_social_inf ON voters(social_influencer_id);
