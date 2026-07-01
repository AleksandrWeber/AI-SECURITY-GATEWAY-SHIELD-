CREATE TABLE "rules" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"rule_json" text NOT NULL,
	"source" text NOT NULL,
	"suggestion_id" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
