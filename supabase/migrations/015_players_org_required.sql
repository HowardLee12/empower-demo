-- Backfill orphan players' org_id from their squad memberships, then enforce NOT NULL.
-- Avoids the "edit player → accidentally clear org → player vanishes from every org-filtered list" footgun.

-- Step 1: for any player whose org_id is null, take the most-recent squad they joined
-- (sb_squad_players.created_at DESC) and copy that squad's org_id.
UPDATE sb_players p
SET org_id = sub.org_id
FROM (
  SELECT DISTINCT ON (sp.player_id) sp.player_id, sq.org_id
  FROM sb_squad_players sp
  JOIN sb_squads sq ON sq.id = sp.squad_id
  ORDER BY sp.player_id, sp.created_at DESC
) sub
WHERE p.id = sub.player_id AND p.org_id IS NULL;

-- Step 2: any players still without an org after backfill cannot be rescued automatically — delete them.
DELETE FROM sb_players WHERE org_id IS NULL;

-- Step 3: lock the column.
ALTER TABLE sb_players ALTER COLUMN org_id SET NOT NULL;
