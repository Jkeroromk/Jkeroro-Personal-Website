-- CreateTable: social_links（首页社交媒体链接，后台可编辑）
CREATE TABLE "social_links" (
    "id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_links_order_idx" ON "social_links"("order");

-- 预置现在首页上的 10 个链接，上线后首页看起来和原来一样
INSERT INTO "social_links" ("id", "platform", "name", "url", "order") VALUES
  (gen_random_uuid(), 'tiktok',     'TikTok',     'https://www.tiktok.com/@jkeroro', 0),
  (gen_random_uuid(), 'instagram',  'Instagram',  'https://www.instagram.com/jkerorozz', 1),
  (gen_random_uuid(), 'youtube',    'YouTube',    'https://youtube.com/@jkeroro_mk?si=kONouwFGS9t-ti3V', 2),
  (gen_random_uuid(), 'twitch',     'Twitch',     'https://www.twitch.tv/jkerorozz', 3),
  (gen_random_uuid(), 'rednote',    'Rednote',    'https://www.xiaohongshu.com/user/profile/678e5f43000000000e0107ac', 4),
  (gen_random_uuid(), 'spotify',    'Spotify',    'https://open.spotify.com/user/jkeroro', 5),
  (gen_random_uuid(), 'soundcloud', 'SoundCloud', 'https://on.soundcloud.com/B1Fe1ewaen6xbNfv9', 6),
  (gen_random_uuid(), 'github',     'GitHub',     'https://github.com/Jkeroromk', 7),
  (gen_random_uuid(), 'linkedin',   'LinkedIn',   'https://www.linkedin.com/in/zexin-zou/', 8),
  (gen_random_uuid(), 'discord',    'Discord',    'https://discord.gg/eD7ZRcg22H', 9);
