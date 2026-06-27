CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_hash` text NOT NULL,
	`prompt_length` integer NOT NULL,
	`risk` text NOT NULL,
	`severity` text NOT NULL,
	`confidence` integer NOT NULL,
	`action` text NOT NULL,
	`rules_version` text NOT NULL,
	`ai_invoked` integer DEFAULT false NOT NULL,
	`pipeline_stage` text NOT NULL,
	`categories_json` text DEFAULT '[]' NOT NULL,
	`matched_rules_json` text DEFAULT '[]' NOT NULL,
	`result_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`method` text,
	`path` text,
	`ip` text,
	`user_agent` text,
	`prompt_hash` text,
	`prompt_length` integer,
	`rules_triggered` text,
	`ai_invoked` integer,
	`result_summary` text,
	`exception` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_cache` (
	`cache_key` text PRIMARY KEY NOT NULL,
	`result_json` text NOT NULL,
	`model` text NOT NULL,
	`rules_version` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `settings` (`key`, `value`, `updated_at`) VALUES ('privacy_mode', 'true', datetime('now'));
--> statement-breakpoint
INSERT INTO `settings` (`key`, `value`, `updated_at`) VALUES ('rules_version', '1.0.0', datetime('now'));
