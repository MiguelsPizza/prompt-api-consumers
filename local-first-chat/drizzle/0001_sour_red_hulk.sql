DROP INDEX "idx_messages_conversation";--> statement-breakpoint
DROP INDEX "idx_messages_conv_position";--> statement-breakpoint
DROP INDEX "idx_messages_created";--> statement-breakpoint
DROP INDEX "idx_messages_user_created";--> statement-breakpoint
DROP INDEX "idx_conversations_user";--> statement-breakpoint
DROP INDEX "idx_conversations_updated";--> statement-breakpoint
DROP INDEX "idx_conversations_user_updated";--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "temperature" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "conversationId" text;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "createdAt" text;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "updatedAt" text;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "temperatureAtCreation" real;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "topKAtCreation" real;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "userId" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "conversationSummary" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "systemPrompt" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "createdAt" text NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "updatedAt" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "topK" real NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "userId" text NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_messages_conversation" ON "conversation_messages" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "idx_messages_conv_position" ON "conversation_messages" USING btree ("conversationId","position");--> statement-breakpoint
CREATE INDEX "idx_messages_created" ON "conversation_messages" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_messages_user_created" ON "conversation_messages" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_conversations_user" ON "conversations" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_conversations_updated" ON "conversations" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "idx_conversations_user_updated" ON "conversations" USING btree ("userId","updatedAt");--> statement-breakpoint
ALTER TABLE "conversation_messages" DROP COLUMN "conversation_id";--> statement-breakpoint
ALTER TABLE "conversation_messages" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "conversation_messages" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "conversation_messages" DROP COLUMN "temperature_at_creation";--> statement-breakpoint
ALTER TABLE "conversation_messages" DROP COLUMN "top_k_at_creation";--> statement-breakpoint
ALTER TABLE "conversation_messages" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "conversation_summary";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "system_prompt";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "top_k";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "user_id";