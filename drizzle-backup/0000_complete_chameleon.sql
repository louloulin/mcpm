CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "access_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"user_id" text,
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "compatible_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "compatible_clients_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "download_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" text NOT NULL,
	"user_id" text,
	"ip_address" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "parameters" (
	"id" serial PRIMARY KEY NOT NULL,
	"tool_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"required" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" text NOT NULL,
	"user_id" text NOT NULL,
	"score" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_args" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" text NOT NULL,
	"arg" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_clients" (
	"server_id" text NOT NULL,
	"client_id" integer NOT NULL,
	CONSTRAINT "server_clients_server_id_client_id_pk" PRIMARY KEY("server_id","client_id")
);
--> statement-breakpoint
CREATE TABLE "server_env_vars" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" text NOT NULL,
	"key" text NOT NULL,
	"value" text
);
--> statement-breakpoint
CREATE TABLE "server_tags" (
	"server_id" text NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "server_tags_server_id_tag_id_pk" PRIMARY KEY("server_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" text PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"version" varchar(20) NOT NULL,
	"description" text,
	"author_id" text,
	"homepage" text,
	"repository" text,
	"license" text,
	"start_command" text,
	"downloads" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "servers_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar(100) NOT NULL,
	"status" varchar(20) NOT NULL,
	"details" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"color" varchar(7),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" varchar(100),
	"bio" text,
	"avatar_url" text,
	"website" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"reset_password_token" text,
	"reset_password_expires" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" text NOT NULL,
	"processed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"details" text
);
--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_history" ADD CONSTRAINT "download_history_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_history" ADD CONSTRAINT "download_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameters" ADD CONSTRAINT "parameters_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_args" ADD CONSTRAINT "server_args_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_clients" ADD CONSTRAINT "server_clients_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_clients" ADD CONSTRAINT "server_clients_client_id_compatible_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."compatible_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_env_vars" ADD CONSTRAINT "server_env_vars_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_tags" ADD CONSTRAINT "server_tags_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_tags" ADD CONSTRAINT "server_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_server_idx" ON "ratings" USING btree ("user_id","server_id");--> statement-breakpoint
CREATE UNIQUE INDEX "key_idx" ON "servers" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "name_idx" ON "servers" USING btree ("name");