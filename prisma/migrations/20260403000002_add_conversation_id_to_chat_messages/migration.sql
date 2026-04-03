-- Add conversation_id to chat_messages (was missing from initial migration)
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "conversation_id" TEXT NOT NULL DEFAULT 'default';

-- Replace old index with new one that includes conversation_id
DROP INDEX IF EXISTS "chat_messages_user_id_created_at_idx";
CREATE INDEX IF NOT EXISTS "chat_messages_user_id_conversation_id_created_at_idx" ON "chat_messages"("user_id", "conversation_id", "created_at");
