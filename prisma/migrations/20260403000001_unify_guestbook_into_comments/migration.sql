-- Add name and emoji columns to comments table
-- This unifies the guestbook into the comments table
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "emoji" TEXT;
