-- Add logo URL to organizations
ALTER TABLE sb_organizations ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '';

-- Create storage bucket for logos (run this in Supabase Dashboard > Storage if this doesn't work via SQL)
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT DO NOTHING;

-- Allow public read access to logos
CREATE POLICY "Public read logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
-- Allow anon upload (demo mode)
CREATE POLICY "Anon upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos');
CREATE POLICY "Anon update logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos');
CREATE POLICY "Anon delete logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos');
