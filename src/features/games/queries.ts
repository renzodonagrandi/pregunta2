import 'server-only'
import { and, asc, desc, eq, inArray, type SQL } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { getDb } from '@/lib/db'
import { categories, games, questions } from './schema'
import { hashEditToken } from './tokens'
import type {
  EditorCategory,
  EditorGame,
  GameSummary,
  PlayableGame,
} from './types'

export const PUBLISHED_GAMES_TAG = 'games:published'
export const gameTag = (gameId: string) => `game:${gameId}`

type GameRow = typeof games.$inferSelect

/**
 * Loads one game (matched by `where`, a unique condition on `games`) with its
 * categories and questions. The three queries go to Neon in a single batch
 * (one HTTP round trip) instead of waiting on each other.
 */
async function loadGame(
  where: SQL,
): Promise<{ row: GameRow; categories: EditorCategory[] } | null> {
  const db = getDb()
  const gameIds = db.select({ id: games.id }).from(games).where(where)
  const [rows, cats, qs] = await db.batch([
    db.select().from(games).where(where).limit(1),
    db
      .select()
      .from(categories)
      .where(inArray(categories.gameId, gameIds))
      .orderBy(asc(categories.sortOrder)),
    db
      .select({
        id: questions.id,
        categoryId: questions.categoryId,
        text: questions.text,
        imageUrl: questions.imageUrl,
        options: questions.options,
        correctIndex: questions.correctIndex,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(inArray(categories.gameId, gameIds))
      .orderBy(asc(questions.createdAt), asc(questions.id)),
  ])
  const [row] = rows
  if (!row) return null
  return {
    row,
    categories: cats.map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      imageUrl: c.imageUrl,
      questions: qs
        .filter(q => q.categoryId === c.id)
        .map(q => ({
          id: q.id,
          text: q.text,
          imageUrl: q.imageUrl,
          options: q.options,
          correctIndex: q.correctIndex,
        })),
    })),
  }
}

function toEditorGame(row: GameRow, cats: EditorCategory[]): EditorGame {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    published: row.published,
    categories: cats,
  }
}

/** Full bundle (categories + questions) of a published game, or null. */
export async function getPlayableGame(
  slug: string,
): Promise<PlayableGame | null> {
  'use cache'
  cacheLife('max')
  cacheTag(`game-slug:${slug}`)

  const game = await loadGame(
    and(eq(games.slug, slug), eq(games.published, true)) as SQL,
  )
  if (!game) return null
  const { row, categories: cats } = game
  cacheTag(gameTag(row.id))

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    categories: cats.map(({ id, name, color, imageUrl }) => ({
      id,
      name,
      color,
      imageUrl,
    })),
    questions: cats.flatMap(c =>
      c.questions.map(q => ({ ...q, categoryId: c.id })),
    ),
  }
}

/** Published games for the home page, newest first. */
export async function listPublishedGames(): Promise<GameSummary[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(PUBLISHED_GAMES_TAG)

  const db = getDb()
  const newest = db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.published, true))
    .orderBy(desc(games.updatedAt))
    .limit(60)
  // Both queries in one round trip; categories are filtered by the same subquery.
  const [rows, cats] = await db.batch([
    db
      .select({ id: games.id, slug: games.slug, title: games.title })
      .from(games)
      .where(inArray(games.id, newest))
      .orderBy(desc(games.updatedAt)),
    db
      .select({
        id: categories.id,
        gameId: categories.gameId,
        name: categories.name,
        color: categories.color,
        imageUrl: categories.imageUrl,
      })
      .from(categories)
      .where(inArray(categories.gameId, newest))
      .orderBy(asc(categories.sortOrder)),
  ])
  return rows.map(r => ({
    slug: r.slug,
    title: r.title,
    categories: cats
      .filter(c => c.gameId === r.id)
      .map(({ id, name, color, imageUrl }) => ({ id, name, color, imageUrl })),
  }))
}

/** Game row for a secret edit token; the only authorization for editing. */
export async function findGameByToken(token: string): Promise<GameRow | null> {
  const [row] = await getDb()
    .select()
    .from(games)
    .where(eq(games.editTokenHash, hashEditToken(token)))
    .limit(1)
  return row ?? null
}

export async function getEditorGame(
  gameId: string,
): Promise<EditorGame | null> {
  const game = await loadGame(eq(games.id, gameId))
  return game ? toEditorGame(game.row, game.categories) : null
}

export async function getEditorGameByToken(
  token: string,
): Promise<EditorGame | null> {
  const game = await loadGame(eq(games.editTokenHash, hashEditToken(token)))
  return game ? toEditorGame(game.row, game.categories) : null
}
