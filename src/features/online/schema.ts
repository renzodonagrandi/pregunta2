import {
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
import { games } from '@/features/games/schema'
import type { GameState } from '@/features/match/engine'
import type { MatchStatus } from './rules'

/**
 * An online match between two devices. `state` is the full engine state,
 * including a snapshot of the game, so editing the game never affects
 * matches already in progress.
 */
export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Short public code used in the invite link: /p/[code]. */
    code: text('code').notNull().unique(),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    state: jsonb('state').$type<GameState>().notNull(),
    /** Bumped on every write; guards against concurrent updates. */
    version: integer('version').notNull().default(0),
    status: text('status').$type<MatchStatus>().notNull().default('waiting'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  t => [index('matches_updated_at_idx').on(t.updatedAt)],
)

export const matchPlayers = pgTable(
  'match_players',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    /** 0 = creator (starts), 1 = invited player. */
    seat: smallint('seat').$type<0 | 1>().notNull(),
    name: text('name').notNull(),
    /** SHA-256 of the player's secret token (kept in an httpOnly cookie). */
    tokenHash: text('token_hash').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  t => [uniqueIndex('match_players_seat_idx').on(t.matchId, t.seat)],
)
