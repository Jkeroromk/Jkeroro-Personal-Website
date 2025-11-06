-- ============================================
-- 创建纪念日设置表（完整版 - 包含所有列）
-- ============================================
-- 在 Supabase Dashboard -> SQL Editor 中执行此 SQL

-- 步骤 1: 创建表（如果不存在）
CREATE TABLE IF NOT EXISTS "anniversary_settings" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anniversary_settings_pkey" PRIMARY KEY ("id")
);

-- 步骤 2: 添加所有需要的列（如果不存在）
ALTER TABLE "anniversary_settings" 
ADD COLUMN IF NOT EXISTS "background_images" JSONB DEFAULT '[]'::jsonb;

ALTER TABLE "anniversary_settings" 
ADD COLUMN IF NOT EXISTS "image_positions" JSONB DEFAULT '{}'::jsonb;

-- 步骤 3: 如果存在旧的 background_image 列，迁移数据到 background_images
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'anniversary_settings' 
        AND column_name = 'background_image'
    ) THEN
        -- 迁移旧数据到新列
        UPDATE "anniversary_settings"
        SET "background_images" = CASE
            WHEN "background_image" IS NOT NULL AND "background_image" != '' THEN
                jsonb_build_array("background_image")
            ELSE
                COALESCE("background_images", '[]'::jsonb)
        END
        WHERE "background_images" IS NULL OR "background_images" = '[]'::jsonb;
    END IF;
END $$;

-- 步骤 4: 创建初始记录（如果不存在）
INSERT INTO "anniversary_settings" ("id", "background_images", "image_positions", "created_at", "updated_at")
VALUES ('main', '[]'::jsonb, '{}'::jsonb, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE
SET 
  "background_images" = COALESCE("anniversary_settings"."background_images", '[]'::jsonb),
  "image_positions" = COALESCE("anniversary_settings"."image_positions", '{}'::jsonb);

-- 步骤 5: 确保所有现有记录都有正确的默认值
UPDATE "anniversary_settings" 
SET 
  "background_images" = COALESCE("background_images", '[]'::jsonb),
  "image_positions" = COALESCE("image_positions", '{}'::jsonb)
WHERE "id" = 'main';

