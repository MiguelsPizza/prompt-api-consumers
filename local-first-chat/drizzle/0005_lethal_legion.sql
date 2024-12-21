ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "conversation_messages" DROP CONSTRAINT "conversation_messages_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "idx_messages_user_created";--> statement-breakpoint
DROP INDEX "idx_conversations_user";--> statement-breakpoint
DROP INDEX "idx_conversations_user_updated";