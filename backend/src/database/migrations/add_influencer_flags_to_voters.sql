-- Migration: Add explicit influencer flags to voters
-- Description: Adds is_family_influencer and is_social_influencer boolean columns to voters table to explicitly track designated influencers.

ALTER TABLE voters
  ADD COLUMN IF NOT EXISTS is_family_influencer BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_social_influencer BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_voters_is_fam_inf ON voters(is_family_influencer);
CREATE INDEX IF NOT EXISTS idx_voters_is_soc_inf ON voters(is_social_influencer);

-- Backfill existing voters who already have linked influenced voters
UPDATE voters v
SET is_family_influencer = TRUE
WHERE EXISTS (SELECT 1 FROM voters fv WHERE fv.family_influencer_id = v.id);

UPDATE voters v
SET is_social_influencer = TRUE
WHERE EXISTS (SELECT 1 FROM voters sv WHERE sv.social_influencer_id = v.id);
