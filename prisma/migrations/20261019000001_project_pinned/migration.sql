-- 项目置顶：projects 表加一个 pinned 字段，默认 false（现有项目都不置顶）。
-- 只加列，不改已有数据；旧代码读不到这一列也不受影响。
-- 用 IF NOT EXISTS：如果线上已经手动加过，正式部署时重复执行也不会报错。
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "pinned" BOOLEAN NOT NULL DEFAULT false;
