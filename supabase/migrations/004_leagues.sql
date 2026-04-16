-- Leagues / Divisions (e.g. 2026年第一季和平信義週六男子組)
CREATE TABLE IF NOT EXISTS sb_leagues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  season TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add league reference to games
ALTER TABLE sb_games ADD COLUMN IF NOT EXISTS league_id UUID REFERENCES sb_leagues(id);

-- RLS
ALTER TABLE sb_leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sb_leagues" ON sb_leagues FOR SELECT USING (true);
CREATE POLICY "Anon write sb_leagues" ON sb_leagues FOR ALL USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO sb_leagues (id, name, region, season) VALUES
  ('c0000000-0000-0000-0000-000000000001', '2026年第一季週六男子組', '台北信義', '2026 Q1'),
  ('c0000000-0000-0000-0000-000000000002', '2026年第一季週日男子組', '台北信義', '2026 Q1'),
  ('c0000000-0000-0000-0000-000000000003', '2026年第一季週六男子組', '台北大安', '2026 Q1'),
  ('c0000000-0000-0000-0000-000000000004', '2026年第一季週日男子組', '台北板橋', '2026 Q1'),
  ('c0000000-0000-0000-0000-000000000005', '2026年第一季週六男子組', '台北中正', '2026 Q1'),
  ('c0000000-0000-0000-0000-000000000006', '2026年第一季週日男子組', '台中南屯', '2026 Q1'),
  ('c0000000-0000-0000-0000-000000000007', '2026年第一季週六男子組', '台中北區', '2026 Q1');
