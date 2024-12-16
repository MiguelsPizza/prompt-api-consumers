CREATE TABLE "conversation_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"temperature_at_creation" real NOT NULL,
	"top_k_at_creation" real NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"conversation_summary" text,
	"system_prompt" text DEFAULT '' NOT NULL,
	"top_k" real NOT NULL,
	"temperature" real NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_messages_conversation" ON "conversation_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_messages_position" ON "conversation_messages" USING btree ("position");--> statement-breakpoint
CREATE INDEX "idx_messages_conv_position" ON "conversation_messages" USING btree ("conversation_id","position");--> statement-breakpoint
CREATE INDEX "idx_messages_created" ON "conversation_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_messages_user_created" ON "conversation_messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_conversations_user" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_updated" ON "conversations" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_conversations_user_updated" ON "conversations" USING btree ("user_id","updated_at");