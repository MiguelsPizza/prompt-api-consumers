DROP INDEX "idx_messages_conversation";--> statement-breakpoint
DROP INDEX "idx_messages_conv_position";--> statement-breakpoint
DROP INDEX "idx_messages_created";--> statement-breakpoint
DROP INDEX "idx_messages_user_created";--> statement-breakpoint
DROP INDEX "idx_conversations_user";--> statement-breakpoint
DROP INDEX "idx_conversations_updated";--> statement-breakpoint
DROP INDEX "idx_conversations_user_updated";--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "conversation_id" text;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "created_at" text;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "updated_at" text;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "temperature_at_creation" real;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "top_k_at_creation" real;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "conversation_summary" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "system_prompt" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "created_at" text NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "updated_at" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "top_k" real NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_messages_conversation" ON "conversation_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_messages_conv_position" ON "conversation_messages" USING btree ("conversation_id","position");--> statement-breakpoint
CREATE INDEX "idx_messages_created" ON "conversation_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_messages_user_created" ON "conversation_messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_conversations_user" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_updated" ON "conversations" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_conversations_user_updated" ON "conversations" USING btree ("user_id","updated_at");--> statement-breakpoint
ALTER TABLE "conversation_messages" DROP COLUMN "conversationId";--> statement-breakpoint
ALTER TABLE "conversation_messages" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "conversation_messages" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "conversation_messages" DROP COLUMN "temperatureAtCreation";--> statement-breakpoint
ALTER TABLE "conversation_messages" DROP COLUMN "topKAtCreation";--> statement-breakpoint
ALTER TABLE "conversation_messages" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "conversationSummary";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "systemPrompt";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "topK";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "userId";