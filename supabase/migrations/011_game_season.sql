-- Add season to games (e.g., "2026 S1")
ALTER TABLE sb_games ADD COLUMN IF NOT EXISTS season TEXT NOT NULL DEFAULT '';

-- Add homepage_season to leagues — which season's standings to show on homepage
ALTER TABLE sb_leagues ADD COLUMN IF NOT EXISTS homepage_season TEXT NOT NULL DEFAULT '';
