-- 安全修复：给最近新建的表打开 Row Level Security（Supabase 安全提醒 rls_disabled_in_public）
-- 没开 RLS 时，任何拿到前端公开 anon key 的人都能通过 Supabase API 读、改、删这些表。
-- 网站自己是通过 Prisma 用 postgres 角色连数据库的，这个角色本来就绕过 RLS，所以网站不受影响。
-- 这次已经在线上数据库手动执行过；这里再写一份让代码和数据库保持一致（重复执行没有副作用）。
--
-- 以后新建表，记得在同一个 migration 里加一行：ALTER TABLE "表名" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "social_links"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tech_stack"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cron_runs"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "monthly_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_usage"      ENABLE ROW LEVEL SECURITY;
