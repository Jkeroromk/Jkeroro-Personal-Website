-- 后台「换一张」：标记请求，NAS 轮询后推新照片并清空。只加列，不改已有数据。
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "rotate_requested_at" TIMESTAMP(3);
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "rotate_block" BOOLEAN NOT NULL DEFAULT false;
