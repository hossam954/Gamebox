ALTER TABLE "deposit_requests" ADD COLUMN "currency" text DEFAULT 'SYP';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;