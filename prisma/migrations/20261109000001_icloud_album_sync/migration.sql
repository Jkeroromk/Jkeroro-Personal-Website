-- iCloud 共享相簿自动同步
-- 只加列、加表，不改已有数据；旧代码不读这些列，线上不受影响。都用 IF NOT EXISTS，重复执行没有副作用。

-- images：标记照片来源，iCloud 照片记下它的 photoGuid
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "external_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "images_external_id_key" ON "images"("external_id");

-- 接到网站上的共享相簿
CREATE TABLE IF NOT EXISTS "album_sources" (
    "id" TEXT NOT NULL,
    "share_url" TEXT NOT NULL,
    "album_name" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "items" JSONB NOT NULL DEFAULT '{}',
    "last_synced_at" TIMESTAMP(3),
    "last_result" JSONB NOT NULL DEFAULT '{}',
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "album_sources_pkey" PRIMARY KEY ("id")
);

-- 新表一律打开 RLS（网站走 Prisma 的 postgres 角色，不受影响）
ALTER TABLE "album_sources" ENABLE ROW LEVEL SECURITY;
