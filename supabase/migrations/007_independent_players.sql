-- Add birthday to players
ALTER TABLE sb_players ADD COLUMN IF NOT EXISTS birthday DATE;

-- Make squad_id optional (players can exist independently)
ALTER TABLE sb_players ALTER COLUMN squad_id DROP NOT NULL;

-- Many-to-many: a player can belong to multiple squads
CREATE TABLE IF NOT EXISTS sb_squad_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES sb_squads(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES sb_players(id) ON DELETE CASCADE,
  jersey_number TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(squad_id, player_id)
);

ALTER TABLE sb_squad_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sb_squad_players" ON sb_squad_players FOR SELECT USING (true);
CREATE POLICY "Anon write sb_squad_players" ON sb_squad_players FOR ALL USING (true) WITH CHECK (true);
