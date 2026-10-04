-- CreateTable: chat_usage（/api/chat 限流用，只存 IP 的哈希）
CREATE TABLE "chat_usage" (
    "id" UUID NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_usage_ip_hash_created_at_idx" ON "chat_usage"("ip_hash", "created_at");

-- CreateIndex
CREATE INDEX "chat_usage_created_at_idx" ON "chat_usage"("created_at");
