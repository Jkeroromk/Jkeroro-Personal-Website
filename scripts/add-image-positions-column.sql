-- ============================================
-- 添加图片位置列（每张图片独立位置）
-- ============================================
-- 在 Supabase Dashboard -> SQL Editor 中执行此 SQL

-- 添加 image_positions 列（如果不存在）
ALTER TABLE "anniversary_settings" 
ADD COLUMN IF NOT EXISTS "image_positions" JSONB DEFAULT '{}'::jsonb;

-- 如果有旧的 image_offset_x 和 image_offset_y 列，迁移数据
DO $$
DECLARE
    old_x DOUBLE PRECISION;
    old_y DOUBLE PRECISION;
    img_url TEXT;
    positions JSONB := '{}'::jsonb;
BEGIN
    -- 检查是否存在旧列
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'anniversary_settings' 
        AND column_name = 'image_offset_x'
    ) THEN
        -- 获取旧的位置值
        SELECT "image_offset_x", "image_offset_y" 
        INTO old_x, old_y
        FROM "anniversary_settings"
        WHERE "id" = 'main';
        
        -- 如果有背景图，为每张图设置相同的位置
        IF old_x IS NOT NULL AND old_y IS NOT NULL THEN
            FOR img_url IN 
                SELECT jsonb_array_elements_text("background_images")
                FROM "anniversary_settings"
                WHERE "id" = 'main' AND "background_images" IS NOT NULL
            LOOP
                positions := positions || jsonb_build_object(img_url, jsonb_build_object('x', old_x, 'y', old_y));
            END LOOP;
            
            -- 更新位置数据
            UPDATE "anniversary_settings"
            SET "image_positions" = positions
            WHERE "id" = 'main';
        END IF;
    END IF;
END $$;

