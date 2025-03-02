CREATE TYPE "public"."supported_llm" AS ENUM('chrome-ai', 'web-llm');--> statement-breakpoint
CREATE TABLE "supported_llms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"max_temperature" real NOT NULL,
	"min_temperature" real NOT NULL,
	"max_top_k" real,
	"min_top_k" real,
	"created_at" timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
	"deleted_at" timestamp with time zone,
	"server_synced" boolean DEFAULT false NOT NULL,
	"server_synced_date" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "last_sign_in_at" TO "last_active_at";--> statement-breakpoint
ALTER TABLE "conversation_messages" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "llm_id_at_creation" "supported_llm" DEFAULT 'chrome-ai' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "server_synced" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "server_synced_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "llm_id" "supported_llm" DEFAULT 'chrome-ai' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "server_synced" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "server_synced_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD COLUMN "server_synced" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD COLUMN "server_synced_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "server_synced" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "server_synced_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clerk_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "server_synced" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "server_synced_date" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_supported_llms_name" ON "supported_llms" USING btree ("name");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id");--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "position_range" CHECK ("conversation_messages"."position" >= 0);--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "content_length" CHECK (length("conversation_messages"."content") <= 32000);--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "temperature_range" CHECK ("conversation_messages"."temperature_at_creation" >= 0 AND "conversation_messages"."temperature_at_creation" <= 10);--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "top_k_range" CHECK ("conversation_messages"."top_k_at_creation" >= 0 AND "conversation_messages"."top_k_at_creation" <= 1000);--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "name_length" CHECK (length("conversations"."name") <= 255);--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "summary_length" CHECK (length("conversations"."conversation_summary") <= 4000);--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "prompt_length" CHECK (length("conversations"."system_prompt") <= 32000);--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "top_k_range" CHECK ("conversations"."top_k" >= 0 AND "conversations"."top_k" <= 1000);--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "temperature_range" CHECK ("conversations"."temperature" >= 0 AND "conversations"."temperature" <= 10);