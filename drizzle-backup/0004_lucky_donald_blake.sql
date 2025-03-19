ALTER TABLE "servers" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "owner_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "owner_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE bigint;