-- AlterTable: projects 加作品区滚动叙事用的三个可选字段（问题 / 做法 / 结果），后台可编辑
ALTER TABLE "projects" ADD COLUMN "problem" TEXT;
ALTER TABLE "projects" ADD COLUMN "approach" TEXT;
ALTER TABLE "projects" ADD COLUMN "result" TEXT;
