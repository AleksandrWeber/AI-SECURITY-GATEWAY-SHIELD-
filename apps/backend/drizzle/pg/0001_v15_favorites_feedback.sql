CREATE TABLE "favorites" (
	"analysis_id" text PRIMARY KEY NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"analysis_id" text NOT NULL,
	"type" text NOT NULL,
	"note" text,
	"risk_at_report" text NOT NULL,
	"created_at" text NOT NULL
);
