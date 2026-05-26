-- Separate cups from seasons.
-- BEFORE: sb_leagues conflates cup + season (each row = one cup-season).
-- AFTER : sb_cups (permanent cups) + sb_seasons (per-cup seasons).
-- sb_games links to sb_seasons. sb_league_squads/rosters become sb_season_squads/rosters.

BEGIN;

-- ============================================================
-- 1. Rename sb_leagues -> sb_cups, add type column
-- ============================================================
ALTER TABLE sb_leagues RENAME TO sb_cups;
ALTER TABLE sb_cups ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT '';

-- ============================================================
-- 2. Create sb_seasons
-- ============================================================
CREATE TABLE IF NOT EXISTS sb_seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cup_id UUID NOT NULL REFERENCES sb_cups(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  year INTEGER,
  is_homepage BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cup_id, name)
);

ALTER TABLE sb_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sb_seasons" ON sb_seasons FOR SELECT USING (true);
CREATE POLICY "Anon write sb_seasons" ON sb_seasons FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 3. Backfill sb_seasons from existing data
--    One season per (cup, distinct game.season). Fallback to cup.season.
-- ============================================================
INSERT INTO sb_seasons (cup_id, name, year, is_homepage)
SELECT DISTINCT
  c.id,
  COALESCE(NULLIF(TRIM(g.season), ''), NULLIF(TRIM(c.season), ''), '預設賽季') AS season_name,
  NULLIF(SUBSTRING(COALESCE(NULLIF(TRIM(g.season), ''), NULLIF(TRIM(c.season), '')) FROM '\d{4}'), '')::INTEGER AS year,
  (c.show_on_homepage AND COALESCE(NULLIF(TRIM(g.season), ''), NULLIF(TRIM(c.season), '')) = NULLIF(TRIM(c.homepage_season), '')) AS is_homepage
FROM sb_cups c
LEFT JOIN sb_games g ON g.league_id = c.id
WHERE g.id IS NOT NULL OR TRIM(c.season) != ''
ON CONFLICT (cup_id, name) DO NOTHING;

-- If a cup has show_on_homepage but homepage_season text doesn't match any season,
-- mark the most recent season as homepage as a fallback.
UPDATE sb_seasons s SET is_homepage = true
WHERE s.id IN (
  SELECT DISTINCT ON (c.id) s2.id
  FROM sb_cups c
  JOIN sb_seasons s2 ON s2.cup_id = c.id
  WHERE c.show_on_homepage
    AND NOT EXISTS (SELECT 1 FROM sb_seasons s3 WHERE s3.cup_id = c.id AND s3.is_homepage)
  ORDER BY c.id, s2.year DESC NULLS LAST, s2.created_at DESC
);

-- ============================================================
-- 4. Add season_id to sb_games, backfill from (league_id, season text)
-- ============================================================
ALTER TABLE sb_games ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES sb_seasons(id);

UPDATE sb_games sg
SET season_id = s.id
FROM sb_seasons s
JOIN sb_cups c ON c.id = s.cup_id
WHERE sg.league_id = c.id
  AND s.name = COALESCE(NULLIF(TRIM(sg.season), ''), NULLIF(TRIM(c.season), ''), '預設賽季');

-- ============================================================
-- 5. Create sb_season_squads (replaces sb_league_squads, scoped to season)
-- ============================================================
CREATE TABLE IF NOT EXISTS sb_season_squads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES sb_seasons(id) ON DELETE CASCADE,
  squad_id UUID NOT NULL REFERENCES sb_squads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(season_id, squad_id)
);

ALTER TABLE sb_season_squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sb_season_squads" ON sb_season_squads FOR SELECT USING (true);
CREATE POLICY "Anon write sb_season_squads" ON sb_season_squads FOR ALL USING (true) WITH CHECK (true);

-- Backfill: each (cup, squad) pair gets applied to every season of that cup
INSERT INTO sb_season_squads (season_id, squad_id)
SELECT s.id, ls.squad_id
FROM sb_league_squads ls
JOIN sb_seasons s ON s.cup_id = ls.league_id
ON CONFLICT (season_id, squad_id) DO NOTHING;

-- ============================================================
-- 6. Create sb_season_rosters (replaces sb_league_rosters, scoped to season)
-- ============================================================
CREATE TABLE IF NOT EXISTS sb_season_rosters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES sb_seasons(id) ON DELETE CASCADE,
  squad_id UUID NOT NULL REFERENCES sb_squads(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES sb_players(id) ON DELETE CASCADE,
  jersey_number TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(season_id, squad_id, player_id)
);

ALTER TABLE sb_season_rosters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sb_season_rosters" ON sb_season_rosters FOR SELECT USING (true);
CREATE POLICY "Anon write sb_season_rosters" ON sb_season_rosters FOR ALL USING (true) WITH CHECK (true);

INSERT INTO sb_season_rosters (season_id, squad_id, player_id, jersey_number)
SELECT s.id, lr.squad_id, lr.player_id, lr.jersey_number
FROM sb_league_rosters lr
JOIN sb_seasons s ON s.cup_id = lr.league_id
ON CONFLICT (season_id, squad_id, player_id) DO NOTHING;

-- ============================================================
-- 7. Drop legacy columns and tables (data is migrated above)
-- ============================================================
DROP TABLE sb_league_squads;
DROP TABLE sb_league_rosters;

ALTER TABLE sb_games DROP COLUMN league_id;
ALTER TABLE sb_games DROP COLUMN season;

ALTER TABLE sb_cups DROP COLUMN season;
ALTER TABLE sb_cups DROP COLUMN show_on_homepage;
ALTER TABLE sb_cups DROP COLUMN homepage_season;

-- ============================================================
-- 8. Helpful indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sb_seasons_cup_id ON sb_seasons(cup_id);
CREATE INDEX IF NOT EXISTS idx_sb_seasons_is_homepage ON sb_seasons(is_homepage) WHERE is_homepage = true;
CREATE INDEX IF NOT EXISTS idx_sb_games_season_id ON sb_games(season_id);
CREATE INDEX IF NOT EXISTS idx_sb_season_squads_season_id ON sb_season_squads(season_id);
CREATE INDEX IF NOT EXISTS idx_sb_season_rosters_season_id ON sb_season_rosters(season_id);

COMMIT;
