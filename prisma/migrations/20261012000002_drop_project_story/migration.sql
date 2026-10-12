-- AlterTable: 作品区不再显示问题 / 做法 / 结果，去掉这三个字段
ALTER TABLE "projects" DROP COLUMN IF EXISTS "problem";
ALTER TABLE "projects" DROP COLUMN IF EXISTS "approach";
ALTER TABLE "projects" DROP COLUMN IF EXISTS "result";
