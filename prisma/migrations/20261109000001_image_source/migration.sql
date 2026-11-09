-- images 加一个 source 字段，标记这一格是后台手动上传的（manual）还是由 NAS 每天自动换图（nas）
-- 只加列，不改已有数据；旧代码不读这一列，线上不受影响。用 IF NOT EXISTS，重复执行没有副作用。
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual';
