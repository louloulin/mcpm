ALTER TABLE "access_logs" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "access_logs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "access_logs" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "compatible_clients" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "compatible_clients" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "download_history" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "download_history" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "download_history" ALTER COLUMN "server_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "download_history" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "parameters" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "parameters" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "parameters" ALTER COLUMN "tool_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ratings" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ratings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "ratings" ALTER COLUMN "server_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ratings" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ratings" ALTER COLUMN "score" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "server_args" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "server_args" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "server_args" ALTER COLUMN "server_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "server_clients" ALTER COLUMN "server_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "server_clients" ALTER COLUMN "client_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "server_env_vars" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "server_env_vars" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "server_env_vars" ALTER COLUMN "server_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "server_tags" ALTER COLUMN "server_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "server_tags" ALTER COLUMN "tag_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "author_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "downloads" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "rating" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "owner_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "stats" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "stats" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "sync_history" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "sync_history" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tools" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tools" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tools" ALTER COLUMN "server_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();