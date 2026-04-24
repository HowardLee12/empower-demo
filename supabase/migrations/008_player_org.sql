-- Add org_id to players (player belongs to an organization/club)
ALTER TABLE sb_players ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES sb_organizations(id);
