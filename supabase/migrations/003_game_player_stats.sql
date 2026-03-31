-- Per-player stats saved after a game ends
CREATE TABLE IF NOT EXISTS sb_player_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES sb_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES sb_players(id),
  team_side TEXT NOT NULL DEFAULT 'home',
  player_number TEXT NOT NULL DEFAULT '',
  player_name TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL DEFAULT 0,
  fg_made INTEGER NOT NULL DEFAULT 0,
  fg_attempted INTEGER NOT NULL DEFAULT 0,
  three_made INTEGER NOT NULL DEFAULT 0,
  three_attempted INTEGER NOT NULL DEFAULT 0,
  ft_made INTEGER NOT NULL DEFAULT 0,
  ft_attempted INTEGER NOT NULL DEFAULT 0,
  off_rebounds INTEGER NOT NULL DEFAULT 0,
  def_rebounds INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  steals INTEGER NOT NULL DEFAULT 0,
  blocks INTEGER NOT NULL DEFAULT 0,
  turnovers INTEGER NOT NULL DEFAULT 0,
  fouls INTEGER NOT NULL DEFAULT 0,
  playing_seconds INTEGER NOT NULL DEFAULT 0,
  plus_minus INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add home/away squad names to sb_games for easier querying
ALTER TABLE sb_games ADD COLUMN IF NOT EXISTS home_squad_name TEXT NOT NULL DEFAULT '';
ALTER TABLE sb_games ADD COLUMN IF NOT EXISTS away_squad_name TEXT NOT NULL DEFAULT '';
ALTER TABLE sb_games ADD COLUMN IF NOT EXISTS home_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sb_games ADD COLUMN IF NOT EXISTS away_score INTEGER NOT NULL DEFAULT 0;

ALTER TABLE sb_player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sb_player_stats" ON sb_player_stats FOR SELECT USING (true);
CREATE POLICY "Anon write sb_player_stats" ON sb_player_stats FOR ALL USING (true) WITH CHECK (true);
