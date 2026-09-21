CREATE TABLE "survey_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"offer_id" text NOT NULL,
	"status" text DEFAULT 'started' NOT NULL,
	"type" text,
	"transaction_id" text,
	"amount_local" numeric(12, 2),
	"amount_usd" numeric(12, 4),
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "survey_attempts_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
ALTER TABLE "survey_attempts" ADD CONSTRAINT "survey_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "survey_attempts_user_id_idx" ON "survey_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "survey_attempts_offer_id_idx" ON "survey_attempts" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "survey_attempts_status_idx" ON "survey_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "survey_attempts_started_at_idx" ON "survey_attempts" USING btree ("started_at");