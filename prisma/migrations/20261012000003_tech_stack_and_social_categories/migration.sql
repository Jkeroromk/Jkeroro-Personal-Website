-- CreateTable: tech_stack（首页 Tech Stack，后台可编辑、可分类）
CREATE TABLE "tech_stack" (
    "id" UUID NOT NULL,
    "icon" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tech_stack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tech_stack_order_idx" ON "tech_stack"("order");

-- 预置现在首页上的 10 个技术，分成两组，上线后可以在后台改
INSERT INTO "tech_stack" ("id", "icon", "name", "category", "order") VALUES
  (gen_random_uuid(), 'html5',      'HTML5',      'Frontend',        0),
  (gen_random_uuid(), 'css3',       'CSS3',       'Frontend',        1),
  (gen_random_uuid(), 'javascript', 'JavaScript', 'Frontend',        2),
  (gen_random_uuid(), 'typescript', 'TypeScript', 'Frontend',        3),
  (gen_random_uuid(), 'react',      'React',      'Frontend',        4),
  (gen_random_uuid(), 'nextjs',     'Next.js',    'Frontend',        5),
  (gen_random_uuid(), 'tailwind',   'Tailwind',   'Frontend',        6),
  (gen_random_uuid(), 'nodejs',     'Node.js',    'Backend & Tools', 7),
  (gen_random_uuid(), 'vite',       'Vite',       'Backend & Tools', 8),
  (gen_random_uuid(), 'figma',      'Figma',      'Backend & Tools', 9);

-- AlterTable: social_links 加分类
ALTER TABLE "social_links" ADD COLUMN "category" TEXT NOT NULL DEFAULT '';

-- 现有链接按平台先分好组，上线后可以在后台改
UPDATE "social_links" SET "category" = CASE
  WHEN "platform" IN ('spotify', 'soundcloud', 'applemusic', 'netease') THEN 'Music'
  WHEN "platform" IN ('github', 'linkedin', 'medium', 'discord', 'telegram', 'website', 'other') THEN 'Work & Community'
  ELSE 'Social'
END;
