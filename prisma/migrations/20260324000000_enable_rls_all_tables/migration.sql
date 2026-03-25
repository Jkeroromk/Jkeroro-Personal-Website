-- Enable Row Level Security on all public tables
-- This fixes the Supabase security vulnerability: rls_disabled_in_public

-- Enable RLS
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tracks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comment_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "view_count" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "country_visits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_status" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "anniversary_settings" ENABLE ROW LEVEL SECURITY;

-- Public read policies (portfolio content is public)
CREATE POLICY "Public can read images" ON "images" FOR SELECT USING (true);
CREATE POLICY "Public can read tracks" ON "tracks" FOR SELECT USING (true);
CREATE POLICY "Public can read projects" ON "projects" FOR SELECT USING (true);
CREATE POLICY "Public can read comments" ON "comments" FOR SELECT USING (true);
CREATE POLICY "Public can read comment_reactions" ON "comment_reactions" FOR SELECT USING (true);
CREATE POLICY "Public can read view_count" ON "view_count" FOR SELECT USING (true);
CREATE POLICY "Public can read country_visits" ON "country_visits" FOR SELECT USING (true);
CREATE POLICY "Public can read admin_status" ON "admin_status" FOR SELECT USING (true);
CREATE POLICY "Public can read anniversary_settings" ON "anniversary_settings" FOR SELECT USING (true);

-- users table: no public read (sensitive data)
-- All write operations go through server-side Prisma (service_role bypasses RLS)
-- so no INSERT/UPDATE/DELETE policies are needed for client-side access
