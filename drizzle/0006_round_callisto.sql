ALTER TABLE "daily_task_completions" ADD COLUMN "verification_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_task_completions" ADD COLUMN "evidence_id" text;--> statement-breakpoint
ALTER TABLE "daily_task_completions" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "daily_tasks" ADD COLUMN "verification_type" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_tasks" ADD COLUMN "verification_value" text;