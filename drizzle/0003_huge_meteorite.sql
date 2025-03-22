CREATE TABLE "collection_servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"server_id" uuid NOT NULL,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "server_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(100) NOT NULL,
	"cover_image" text,
	"created_by" uuid,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "server_collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "server_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"server_id" uuid NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"reason" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "collection_servers" ADD CONSTRAINT "collection_servers_collection_id_server_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."server_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_servers" ADD CONSTRAINT "collection_servers_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_collections" ADD CONSTRAINT "server_collections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_recommendations" ADD CONSTRAINT "server_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_recommendations" ADD CONSTRAINT "server_recommendations_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collection_server_idx" ON "collection_servers" USING btree ("collection_id","server_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collection_slug_idx" ON "server_collections" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "user_server_rec_idx" ON "server_recommendations" USING btree ("user_id","server_id");