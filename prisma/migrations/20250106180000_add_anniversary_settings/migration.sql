-- CreateTable
CREATE TABLE IF NOT EXISTS "anniversary_settings" (
    "id" TEXT NOT NULL,
    "background_image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anniversary_settings_pkey" PRIMARY KEY ("id")
);

-- Create initial record
INSERT INTO "anniversary_settings" ("id", "background_image", "created_at", "updated_at")
VALUES ('main', NULL, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

