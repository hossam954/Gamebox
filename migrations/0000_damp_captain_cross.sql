CREATE TABLE "deposit_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"username" text NOT NULL,
	"amount" integer NOT NULL,
	"payment_method_id" varchar,
	"transaction_number" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_win_rate" integer DEFAULT 50 NOT NULL,
	"target_loss_rate" integer DEFAULT 70 NOT NULL,
	"max_multiplier" integer DEFAULT 50 NOT NULL,
	"strategy" text DEFAULT 'balanced' NOT NULL,
	"phase1_rounds" integer DEFAULT 10 NOT NULL,
	"phase2_rounds" integer DEFAULT 20 NOT NULL,
	"multiplier_2to5_chance" integer DEFAULT 40 NOT NULL,
	"multiplier_5to10_chance" integer DEFAULT 30 NOT NULL,
	"multiplier_10to25_chance" integer DEFAULT 20 NOT NULL,
	"multiplier_25to50_chance" integer DEFAULT 8 NOT NULL,
	"multiplier_50plus_chance" integer DEFAULT 2 NOT NULL,
	"high_bet_threshold" integer DEFAULT 5000 NOT NULL,
	"high_bet_max_multiplier" integer DEFAULT 20 NOT NULL,
	"behavior_tracking_enabled" boolean DEFAULT true NOT NULL,
	"bet_increase_after_win_penalty" integer DEFAULT 15 NOT NULL,
	"consecutive_wins_penalty" integer DEFAULT 10 NOT NULL,
	"house_edge_boost" integer DEFAULT 5 NOT NULL,
	"always_lose" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_recovery_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'both' NOT NULL,
	"currency" text DEFAULT 'SYP' NOT NULL,
	"min_amount" integer DEFAULT 0 NOT NULL,
	"max_amount" integer DEFAULT 100000 NOT NULL,
	"min_amount_usd" integer DEFAULT 0 NOT NULL,
	"max_amount_usd" integer DEFAULT 1000 NOT NULL,
	"fee" integer DEFAULT 0 NOT NULL,
	"note_en" text DEFAULT '' NOT NULL,
	"note_ar" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"withdraw_fee" integer DEFAULT 0 NOT NULL,
	"min_deposit" integer DEFAULT 50 NOT NULL,
	"max_deposit" integer DEFAULT 50000 NOT NULL,
	"min_withdraw" integer DEFAULT 100 NOT NULL,
	"max_withdraw" integer DEFAULT 50000 NOT NULL,
	"deposit_address" text DEFAULT '' NOT NULL,
	"payment_method" text DEFAULT 'Bank Transfer' NOT NULL,
	"win_rate" integer DEFAULT 50 NOT NULL,
	"usd_deposit_rate" integer DEFAULT 15000 NOT NULL,
	"usd_withdraw_rate" integer DEFAULT 15000 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"value" integer NOT NULL,
	"type" text DEFAULT 'balance' NOT NULL,
	"usage_limit" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"username" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"response" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"total_wins" integer DEFAULT 0 NOT NULL,
	"total_losses" integer DEFAULT 0 NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"referral_code" text,
	"referred_by" text,
	"language" text DEFAULT 'en' NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"total_bets_count" integer DEFAULT 0 NOT NULL,
	"total_wagered" integer DEFAULT 0 NOT NULL,
	"lifetime_profit" integer DEFAULT 0 NOT NULL,
	"session_start_balance" integer DEFAULT 0 NOT NULL,
	"session_bets_count" integer DEFAULT 0 NOT NULL,
	"last_bet_amount" integer DEFAULT 0 NOT NULL,
	"last_game_result" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "withdraw_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"username" text NOT NULL,
	"amount" integer NOT NULL,
	"payment_method_id" varchar,
	"address" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
