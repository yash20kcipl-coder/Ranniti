-- Add AC-wise Social Influencer scope flag to voters
ALTER TABLE voters ADD COLUMN IF NOT EXISTS is_ac_social_influencer BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_voters_ac_social_inf ON voters(is_ac_social_influencer) WHERE is_ac_social_influencer = TRUE;
