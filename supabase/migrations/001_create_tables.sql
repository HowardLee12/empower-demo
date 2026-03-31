-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  link_url TEXT NOT NULL DEFAULT '#',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Coaches
CREATE TABLE IF NOT EXISTS coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  date DATE,
  location TEXT NOT NULL DEFAULT '',
  registration_url TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  published_at DATE DEFAULT CURRENT_DATE,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  schedule TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  age_group TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  registration_url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Public read coaches" ON coaches FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Public read courses" ON courses FOR SELECT USING (true);

-- Anon write policies (for demo purposes - in production use auth)
CREATE POLICY "Anon write banners" ON banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write coaches" ON coaches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write articles" ON articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write courses" ON courses FOR ALL USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO banners (title, subtitle, link_url, is_active, sort_order) VALUES
  ('EMPOWER 2026 夏季籃球營', '點燃你的籃球夢想', '#events', true, 1),
  ('Team EMPOWER 菁英選手培訓', '加入最頂尖的訓練團隊', '#events', true, 2);

INSERT INTO coaches (name, title, bio, is_active, sort_order) VALUES
  ('陳教練', '總教練', '擁有15年籃球教學經驗，前職業球員。專精基礎動作訓練與比賽策略。', true, 1),
  ('林教練', '助理教練', '大學籃球隊出身，擅長體能訓練與投籃技巧指導。', true, 2),
  ('王教練', '青少年組教練', '專注青少年籃球發展，以趣味教學方式培養孩子對籃球的熱情。', true, 3);

INSERT INTO events (title, description, date, location, registration_url, is_published, sort_order) VALUES
  ('WONDER 籃球探索營', '適合初學者的籃球體驗營，從基礎開始培養籃球興趣與技能。', '2026-07-15', '台北市信義運動中心', 'https://www.empower.com.tw/', true, 1),
  ('Rookies 新秀訓練營', '針對有基礎的球員，進階技術訓練與團隊戰術養成。', '2026-07-22', '新北市板橋體育館', 'https://www.empower.com.tw/', true, 2),
  ('SPARK 暑期特訓班', '密集訓練課程，提升球員的技術水平與比賽經驗。', '2026-08-01', '台北市大安運動中心', 'https://www.empower.com.tw/', true, 3);

INSERT INTO articles (title, excerpt, content, published_at, is_published) VALUES
  ('EMPOWER All-Star Game 精彩回顧', '年度明星賽圓滿落幕，選手們展現了驚人的進步與團隊精神。', '年度明星賽圓滿落幕，選手們展現了驚人的進步與團隊精神。本屆比賽共有 48 位選手參加...', '2026-03-15', true),
  ('國際交流：日本東京移地訓練紀實', 'Team EMPOWER 遠赴東京與當地球隊進行交流賽，拓展國際視野。', 'Team EMPOWER 遠赴東京與當地球隊進行交流賽，拓展國際視野。為期一週的行程中...', '2026-03-01', true);

INSERT INTO courses (title, description, schedule, location, age_group, registration_url, is_active, sort_order) VALUES
  ('基礎籃球班', '適合 6-10 歲初學者，培養基本運球、傳球、投籃技巧。', '每週六 09:00-11:00', '台北市信義運動中心', '6-10 歲', 'https://www.empower.com.tw/', true, 1),
  ('進階技術班', '適合有基礎的球員，專注個人技術提升與比賽觀念。', '每週六 14:00-16:00', '台北市大安運動中心', '10-14 歲', 'https://www.empower.com.tw/', true, 2),
  ('菁英培訓班', '針對校隊選手或有志參加比賽的球員，高強度訓練。', '每週日 10:00-13:00', '新北市板橋體育館', '14-18 歲', 'https://www.empower.com.tw/', true, 3);
