ALTER TABLE "servers" DROP CONSTRAINT "servers_author_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "access_logs" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "download_history" ALTER COLUMN "server_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "download_history" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ratings" ALTER COLUMN "server_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ratings" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "server_args" ALTER COLUMN "server_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "server_clients" ALTER COLUMN "server_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "server_env_vars" ALTER COLUMN "server_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "server_tags" ALTER COLUMN "server_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "author_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "tools" ALTER COLUMN "server_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "url" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "status" varchar(50) DEFAULT 'offline';--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "type" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "owner_id" integer;