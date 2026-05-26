-- Change sb_games.season_id FK to ON DELETE SET NULL (audit P3.3).
-- When a season (or its parent cup) is deleted, games become orphans
-- rather than blocking the delete with a FK error.
ALTER TABLE sb_games DROP CONSTRAINT sb_games_season_id_fkey;
ALTER TABLE sb_games ADD CONSTRAINT sb_games_season_id_fkey
  FOREIGN KEY (season_id) REFERENCES sb_seasons(id) ON DELETE SET NULL;
