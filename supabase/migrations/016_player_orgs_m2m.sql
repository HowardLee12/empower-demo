-- Convert sb_players.org_id (single FK) → sb_player_orgs (many-to-many).
-- A player can now belong to multiple clubs/orgs.
-- Historical play-by-play data (sb_player_stats, sb_season_rosters, sb_squad_players)
-- is untouched — those tables link via player_id which is unchanged.

-- 1. New M2M table
CREATE TABLE IF NOT EXISTS sb_player_orgs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES sb_players(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES sb_organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, org_id)
);

ALTER TABLE sb_player_orgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sb_player_orgs" ON sb_player_orgs FOR SELECT USING (true);
CREATE POLICY "Anon write sb_player_orgs" ON sb_player_orgs FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sb_player_orgs_player_id ON sb_player_orgs(player_id);
CREATE INDEX IF NOT EXISTS idx_sb_player_orgs_org_id ON sb_player_orgs(org_id);

-- 2. Backfill: every existing player gets one link based on their current org_id.
INSERT INTO sb_player_orgs (player_id, org_id)
SELECT id, org_id FROM sb_players
ON CONFLICT (player_id, org_id) DO NOTHING;

-- 3. Drop the now-redundant column (FK constraint goes with it).
ALTER TABLE sb_players DROP COLUMN org_id;
