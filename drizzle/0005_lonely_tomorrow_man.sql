CREATE TABLE "daily_task_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reward_usd" numeric(12, 2) NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"reward_usd" numeric(12, 2) NOT NULL,
	"audience" text DEFAULT 'all' NOT NULL,
	"action_url" text,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_task_completions" ADD CONSTRAINT "daily_task_completions_task_id_daily_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."daily_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_task_completions" ADD CONSTRAINT "daily_task_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_task_completions_task_user_unique" ON "daily_task_completions" USING btree ("task_id","user_id");--> statement-breakpoint
CREATE INDEX "daily_task_completions_task_id_idx" ON "daily_task_completions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "daily_task_completions_user_id_idx" ON "daily_task_completions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "daily_tasks_starts_at_idx" ON "daily_tasks" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "daily_tasks_expires_at_idx" ON "daily_tasks" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "daily_tasks_audience_idx" ON "daily_tasks" USING btree ("audience");