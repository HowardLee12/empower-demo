-- Add toggle for showing league standings on homepage
ALTER TABLE sb_leagues ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN NOT NULL DEFAULT false;

-- Turn on for existing leagues that have completed games
UPDATE sb_leagues SET show_on_homepage = true
WHERE id IN (SELECT DISTINCT league_id FROM sb_games WHERE status = 'completed' AND league_id IS NOT NULL);
