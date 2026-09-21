CREATE TABLE "weekly_challenges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "challenge_type" text NOT NULL,
  "target" numeric(12,2),
  "reward_usd" numeric(12,2),
  "starts_at" timestamp with time zone NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "status" text NOT NULL DEFAULT 'scheduled',
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "weekly_challenge_prizes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "challenge_id" uuid NOT NULL,
  "rank" numeric(10,0) NOT NULL,
  "reward_usd" numeric(12,2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_challenge_winners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "challenge_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "rank" numeric(10,0) NOT NULL,
  "reward_usd" numeric(12,2) NOT NULL,
  "settled_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "weekly_challenges" ADD CONSTRAINT "weekly_challenges_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "weekly_challenge_prizes" ADD CONSTRAINT "weekly_challenge_prizes_challenge_id_weekly_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."weekly_challenges"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "weekly_challenge_winners" ADD CONSTRAINT "weekly_challenge_winners_challenge_id_weekly_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."weekly_challenges"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "weekly_challenge_winners" ADD CONSTRAINT "weekly_challenge_winners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "weekly_challenges_starts_at_idx" ON "weekly_challenges" USING btree ("starts_at");
--> statement-breakpoint
CREATE INDEX "weekly_challenges_expires_at_idx" ON "weekly_challenges" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX "weekly_challenges_status_idx" ON "weekly_challenges" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_challenge_prizes_challenge_rank_unique" ON "weekly_challenge_prizes" USING btree ("challenge_id","rank");
--> statement-breakpoint
CREATE INDEX "weekly_challenge_prizes_challenge_id_idx" ON "weekly_challenge_prizes" USING btree ("challenge_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_challenge_winners_challenge_user_unique" ON "weekly_challenge_winners" USING btree ("challenge_id","user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_challenge_winners_challenge_rank_unique" ON "weekly_challenge_winners" USING btree ("challenge_id","rank");
--> statement-breakpoint
CREATE INDEX "weekly_challenge_winners_challenge_id_idx" ON "weekly_challenge_winners" USING btree ("challenge_id");
--> statement-breakpoint
CREATE INDEX "weekly_challenge_winners_user_id_idx" ON "weekly_challenge_winners" USING btree ("user_id");
