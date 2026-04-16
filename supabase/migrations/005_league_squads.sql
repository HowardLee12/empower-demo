-- Many-to-many: which squads belong to which leagues
CREATE TABLE IF NOT EXISTS sb_league_squads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID NOT NULL REFERENCES sb_leagues(id) ON DELETE CASCADE,
  squad_id UUID NOT NULL REFERENCES sb_squads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(league_id, squad_id)
);

ALTER TABLE sb_league_squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sb_league_squads" ON sb_league_squads FOR SELECT USING (true);
CREATE POLICY "Anon write sb_league_squads" ON sb_league_squads FOR ALL USING (true) WITH CHECK (true);
