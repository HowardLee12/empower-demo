-- High-frequency join indexes (audit P1 #1)
CREATE INDEX IF NOT EXISTS idx_sb_player_stats_game_id ON sb_player_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_sb_player_stats_player_id ON sb_player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_sb_games_home_squad_id ON sb_games(home_squad_id);
CREATE INDEX IF NOT EXISTS idx_sb_games_away_squad_id ON sb_games(away_squad_id);
CREATE INDEX IF NOT EXISTS idx_sb_games_status ON sb_games(status);
CREATE INDEX IF NOT EXISTS idx_sb_squad_players_squad_id ON sb_squad_players(squad_id);
CREATE INDEX IF NOT EXISTS idx_sb_squad_players_player_id ON sb_squad_players(player_id);
CREATE INDEX IF NOT EXISTS idx_sb_squads_org_id ON sb_squads(org_id);
CREATE INDEX IF NOT EXISTS idx_sb_players_org_id ON sb_players(org_id);
CREATE INDEX IF NOT EXISTS idx_sb_players_squad_id ON sb_players(squad_id);
CREATE INDEX IF NOT EXISTS idx_sb_season_rosters_squad_id ON sb_season_rosters(squad_id);
CREATE INDEX IF NOT EXISTS idx_sb_season_rosters_player_id ON sb_season_rosters(player_id);
CREATE INDEX IF NOT EXISTS idx_sb_season_squads_squad_id ON sb_season_squads(squad_id);

-- Rename leftover sb_leagues policy names on sb_cups (audit P1 #2)
ALTER POLICY "Public read sb_leagues" ON sb_cups RENAME TO "Public read sb_cups";
ALTER POLICY "Anon write sb_leagues" ON sb_cups RENAME TO "Anon write sb_cups";

-- Rename leftover PK index name
ALTER INDEX sb_leagues_pkey RENAME TO sb_cups_pkey;
