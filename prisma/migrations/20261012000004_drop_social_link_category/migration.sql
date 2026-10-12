-- AlterTable: Social Links 不分类了，还原成原来的一整排，去掉 category 字段
ALTER TABLE "social_links" DROP COLUMN IF EXISTS "category";
