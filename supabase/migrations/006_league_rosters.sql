-- Per-league roster: which players play for which squad in which league
CREATE TABLE IF NOT EXISTS sb_league_rosters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID NOT NULL REFERENCES sb_leagues(id) ON DELETE CASCADE,
  squad_id UUID NOT NULL REFERENCES sb_squads(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES sb_players(id) ON DELETE CASCADE,
  jersey_number TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(league_id, squad_id, player_id)
);

ALTER TABLE sb_league_rosters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sb_league_rosters" ON sb_league_rosters FOR SELECT USING (true);
CREATE POLICY "Anon write sb_league_rosters" ON sb_league_rosters FOR ALL USING (true) WITH CHECK (true);
