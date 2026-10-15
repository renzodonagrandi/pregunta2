CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"color" text NOT NULL,
	"image_url" text,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"edit_token_hash" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"locale" text DEFAULT 'es' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "games_slug_unique" UNIQUE("slug"),
	CONSTRAINT "games_edit_token_hash_unique" UNIQUE("edit_token_hash")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"text" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_index" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "questions_correct_index_range" CHECK ("questions"."correct_index" between 0 and 3),
	CONSTRAINT "questions_options_four" CHECK (jsonb_typeof("questions"."options") = 'array' and jsonb_array_length("questions"."options") = 4)
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_game_id_idx" ON "categories" USING btree ("game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_game_color_idx" ON "categories" USING btree ("game_id","color");--> statement-breakpoint
CREATE INDEX "questions_category_id_idx" ON "questions" USING btree ("category_id");