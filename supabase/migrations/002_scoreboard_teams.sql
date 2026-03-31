-- Organizations (top-level teams like 黑熊隊)
CREATE TABLE IF NOT EXISTS sb_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  short_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Squads (sub-teams like U12, U15 within an organization)
CREATE TABLE IF NOT EXISTS sb_squads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES sb_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  age_group TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Players (belong to a squad)
CREATE TABLE IF NOT EXISTS sb_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES sb_squads(id) ON DELETE CASCADE,
  number TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Games (a match between two squads)
CREATE TABLE IF NOT EXISTS sb_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_squad_id UUID NOT NULL REFERENCES sb_squads(id),
  away_squad_id UUID NOT NULL REFERENCES sb_squads(id),
  game_date DATE NOT NULL DEFAULT CURRENT_DATE,
  game_time TIME,
  location TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  quarter_scores_home INTEGER[] DEFAULT '{0,0,0,0}',
  quarter_scores_away INTEGER[] DEFAULT '{0,0,0,0}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE sb_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sb_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sb_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sb_games ENABLE ROW LEVEL SECURITY;

-- Public read + anon write policies (demo)
CREATE POLICY "Public read sb_organizations" ON sb_organizations FOR SELECT USING (true);
CREATE POLICY "Anon write sb_organizations" ON sb_organizations FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read sb_squads" ON sb_squads FOR SELECT USING (true);
CREATE POLICY "Anon write sb_squads" ON sb_squads FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read sb_players" ON sb_players FOR SELECT USING (true);
CREATE POLICY "Anon write sb_players" ON sb_players FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read sb_games" ON sb_games FOR SELECT USING (true);
CREATE POLICY "Anon write sb_games" ON sb_games FOR ALL USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO sb_organizations (id, name, short_name) VALUES
  ('a0000000-0000-0000-0000-000000000001', '黑熊隊', '黑熊'),
  ('a0000000-0000-0000-0000-000000000002', '飛鷹隊', '飛鷹');

INSERT INTO sb_squads (id, org_id, name, age_group) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '黑熊 U12', 'U12'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '黑熊 U15', 'U15'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', '飛鷹 U12', 'U12'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', '飛鷹 U15', 'U15');

INSERT INTO sb_players (squad_id, number, name) VALUES
  ('b0000000-0000-0000-0000-000000000001', '1', '王小明'),
  ('b0000000-0000-0000-0000-000000000001', '3', '李大華'),
  ('b0000000-0000-0000-0000-000000000001', '5', '張志豪'),
  ('b0000000-0000-0000-0000-000000000001', '7', '陳建宏'),
  ('b0000000-0000-0000-0000-000000000001', '11', '林子翔'),
  ('b0000000-0000-0000-0000-000000000002', '2', '黃柏翰'),
  ('b0000000-0000-0000-0000-000000000002', '4', '吳宇軒'),
  ('b0000000-0000-0000-0000-000000000002', '6', '劉俊廷'),
  ('b0000000-0000-0000-0000-000000000002', '8', '蔡承恩'),
  ('b0000000-0000-0000-0000-000000000002', '10', '許家豪'),
  ('b0000000-0000-0000-0000-000000000003', '1', '趙文傑'),
  ('b0000000-0000-0000-0000-000000000003', '3', '周育德'),
  ('b0000000-0000-0000-0000-000000000003', '5', '鄭凱文'),
  ('b0000000-0000-0000-0000-000000000003', '7', '楊宗翰'),
  ('b0000000-0000-0000-0000-000000000003', '9', '謝明軒'),
  ('b0000000-0000-0000-0000-000000000004', '2', '廖子豪'),
  ('b0000000-0000-0000-0000-000000000004', '4', '曾柏安'),
  ('b0000000-0000-0000-0000-000000000004', '6', '洪偉哲'),
  ('b0000000-0000-0000-0000-000000000004', '8', '葉志遠'),
  ('b0000000-0000-0000-0000-000000000004', '10', '宋建志');
