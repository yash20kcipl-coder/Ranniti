-- Consolidate Social Influencer role and scope into a single key: social_influencer_scope (NULL | 'booth' | 'ac')
-- NOTE: Legacy columns (is_social_influencer, is_ac_social_influencer) are intentionally retained for zero-downtime
-- live compatibility and will be dropped in a follow-up migration after all servers are deployed.
ALTER TABLE voters ADD COLUMN IF NOT EXISTS social_influencer_scope VARCHAR(10) DEFAULT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voters' AND column_name = 'is_ac_social_influencer') THEN
    UPDATE voters SET social_influencer_scope = 'ac' WHERE is_ac_social_influencer = TRUE AND social_influencer_scope IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voters' AND column_name = 'is_social_influencer') THEN
    UPDATE voters SET social_influencer_scope = 'booth' WHERE is_social_influencer = TRUE AND social_influencer_scope IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_voters_social_inf_scope ON voters(social_influencer_scope) WHERE social_influencer_scope IS NOT NULL;
