CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"last_used_at" text,
	CONSTRAINT "team_api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN "team_id" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "team_id" text;
