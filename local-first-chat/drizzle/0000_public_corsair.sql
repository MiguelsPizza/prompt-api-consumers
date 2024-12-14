CREATE TABLE "conversation_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text,
	"position" integer,
	"role" text,
	"content" text,
	"created_at" text,
	"updated_at" text,
	"temperature_at_creation" real,
	"top_k_at_creation" real,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"conversation_summary" text,
	"system_prompt" text,
	"created_at" text,
	"updated_at" text,
	"top_k" real,
	"temperature" real,
	"user_id" text
);
--> statement-breakpoint
CREATE INDEX "idx_messages_conversation" ON "conversation_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_messages_position" ON "conversation_messages" USING btree ("position");--> statement-breakpoint
CREATE INDEX "idx_messages_conv_position" ON "conversation_messages" USING btree ("conversation_id","position");--> statement-breakpoint
CREATE INDEX "idx_messages_created" ON "conversation_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_messages_user_created" ON "conversation_messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_conversations_user" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_updated" ON "conversations" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_conversations_user_updated" ON "conversations" USING btree ("user_id","updated_at");