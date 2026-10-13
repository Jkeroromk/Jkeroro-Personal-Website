-- AlterTable: 留言自动过滤，可疑留言先隐藏
ALTER TABLE "comments" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "comments" ADD COLUMN "flag_reason" TEXT;

-- CreateTable: 定时任务运行记录
CREATE TABLE "cron_runs" (
    "id" UUID NOT NULL,
    "job" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL DEFAULT true,
    "result" JSONB NOT NULL DEFAULT '{}',
    "ran_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cron_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cron_runs_job_ran_at_idx" ON "cron_runs"("job", "ran_at");

-- CreateTable: 月报快照
CREATE TABLE "monthly_reports" (
    "id" UUID NOT NULL,
    "month" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "monthly_reports_month_key" ON "monthly_reports"("month");
