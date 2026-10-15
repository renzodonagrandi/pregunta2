import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Public, readable id for `/j/[slug]`. Drafts get a random placeholder. */
  slug: text('slug').notNull().unique(),
  /** SHA-256 of the secret edit token; the token itself is never stored. */
  editTokenHash: text('edit_token_hash').notNull().unique(),
  title: text('title').notNull().default(''),
  locale: text('locale').notNull().default('es'),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default(''),
    color: text('color').notNull(),
    imageUrl: text('image_url'),
    sortOrder: integer('sort_order').notNull(),
  },
  t => [
    index('categories_game_id_idx').on(t.gameId),
    // A color can only be used once per game.
    uniqueIndex('categories_game_color_idx').on(t.gameId, t.color),
  ],
)

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    options: jsonb('options')
      .$type<[string, string, string, string]>()
      .notNull(),
    correctIndex: smallint('correct_index').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  t => [
    index('questions_category_id_idx').on(t.categoryId),
    check(
      'questions_correct_index_range',
      sql`${t.correctIndex} between 0 and 3`,
    ),
    check(
      'questions_options_four',
      sql`jsonb_typeof(${t.options}) = 'array' and jsonb_array_length(${t.options}) = 4`,
    ),
  ],
)
