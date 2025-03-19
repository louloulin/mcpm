ALTER TABLE "access_logs" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "access_logs" ALTER COLUMN "id" SET DEFAULT nextval('access_logs_id_seq');--> statement-breakpoint
ALTER TABLE "compatible_clients" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "compatible_clients" ALTER COLUMN "id" SET DEFAULT nextval('compatible_clients_id_seq');--> statement-breakpoint
ALTER TABLE "download_history" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "download_history" ALTER COLUMN "id" SET DEFAULT nextval('download_history_id_seq');--> statement-breakpoint
ALTER TABLE "parameters" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "parameters" ALTER COLUMN "id" SET DEFAULT nextval('parameters_id_seq');--> statement-breakpoint
ALTER TABLE "ratings" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ratings" ALTER COLUMN "id" SET DEFAULT nextval('ratings_id_seq');--> statement-breakpoint
ALTER TABLE "server_args" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "server_args" ALTER COLUMN "id" SET DEFAULT nextval('server_args_id_seq');--> statement-breakpoint
ALTER TABLE "server_env_vars" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "server_env_vars" ALTER COLUMN "id" SET DEFAULT nextval('server_env_vars_id_seq');--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "id" SET DEFAULT nextval('servers_id_seq');--> statement-breakpoint
ALTER TABLE "stats" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "stats" ALTER COLUMN "id" SET DEFAULT nextval('stats_id_seq');--> statement-breakpoint
ALTER TABLE "sync_history" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "sync_history" ALTER COLUMN "id" SET DEFAULT nextval('sync_history_id_seq');--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "id" SET DEFAULT nextval('tags_id_seq');--> statement-breakpoint
ALTER TABLE "tools" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "tools" ALTER COLUMN "id" SET DEFAULT nextval('tools_id_seq');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT nextval('users_id_seq');--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "id" SET DEFAULT nextval('webhook_events_id_seq');