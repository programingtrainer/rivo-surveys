CREATE TABLE "telegram_code_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reward" numeric(12, 4) NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"reward" numeric(12, 4) NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "telegram_code_redemptions" ADD CONSTRAINT "telegram_code_redemptions_code_id_telegram_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."telegram_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_code_redemptions" ADD CONSTRAINT "telegram_code_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_code_user_unique" ON "telegram_code_redemptions" USING btree ("code_id","user_id");--> statement-breakpoint
CREATE INDEX "telegram_code_redemptions_code_id_idx" ON "telegram_code_redemptions" USING btree ("code_id");--> statement-breakpoint
CREATE INDEX "telegram_code_redemptions_user_id_idx" ON "telegram_code_redemptions" USING btree ("user_id");