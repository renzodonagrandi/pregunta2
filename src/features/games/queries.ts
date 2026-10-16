import 'server-only'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
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

async function loadCategoriesWithQuestions(
  gameId: string,
): Promise<EditorCategory[]> {
  const db = getDb()
  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.gameId, gameId))
    .orderBy(asc(categories.sortOrder))
  if (cats.length === 0) return []
  const qs = await db
    .select()
    .from(questions)
    .where(
      inArray(
        questions.categoryId,
        cats.map(c => c.id),
      ),
    )
    .orderBy(asc(questions.createdAt), asc(questions.id))
  return cats.map(c => ({
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
  }))
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

  const [row] = await getDb()
    .select()
    .from(games)
    .where(and(eq(games.slug, slug), eq(games.published, true)))
    .limit(1)
  if (!row) return null
  cacheTag(gameTag(row.id))

  const cats = await loadCategoriesWithQuestions(row.id)
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
  const rows = await db
    .select()
    .from(games)
    .where(eq(games.published, true))
    .orderBy(desc(games.updatedAt))
    .limit(60)
  if (rows.length === 0) return []
  const cats = await db
    .select()
    .from(categories)
    .where(
      inArray(
        categories.gameId,
        rows.map(r => r.id),
      ),
    )
    .orderBy(asc(categories.sortOrder))
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
  const [row] = await getDb()
    .select()
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1)
  if (!row) return null
  return toEditorGame(row, await loadCategoriesWithQuestions(row.id))
}

export async function getEditorGameByToken(
  token: string,
): Promise<EditorGame | null> {
  const row = await findGameByToken(token)
  if (!row) return null
  return toEditorGame(row, await loadCategoriesWithQuestions(row.id))
}
