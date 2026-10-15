import 'server-only'
import { and, count, eq, ne } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import {
  MAX_CATEGORIES,
  MAX_QUESTIONS_PER_CATEGORY,
  MIN_CATEGORIES,
} from './constants'
import { CATEGORY_COLORS } from './palette'
import { getEditorGame } from './queries'
import { publishIssues, type PublishIssue } from './requirements'
import { categories, games, questions } from './schema'
import type {
  CategoryUpdateInput,
  GameMetaInput,
  QuestionInput,
} from './schemas'
import {
  draftSlug,
  generateEditToken,
  hashEditToken,
  isDraftSlug,
  publicSlug,
} from './tokens'
import type { EditorGame } from './types'

/** Expected failures, returned to the UI instead of thrown. */
export type EditError =
  | 'NOT_FOUND'
  | 'LIMIT_REACHED'
  | 'MIN_CATEGORIES'
  | 'COLOR_TAKEN'
  | 'INVALID_IMAGE'

export class EditFailure extends Error {
  constructor(readonly code: EditError) {
    super(code)
  }
}

/** Creates a draft with three empty categories; returns the secret token. */
export async function createGame(): Promise<string> {
  const token = generateEditToken()
  const gameId = crypto.randomUUID()
  const db = getDb()
  await db.batch([
    db.insert(games).values({
      id: gameId,
      slug: draftSlug(),
      editTokenHash: hashEditToken(token),
    }),
    db.insert(categories).values(
      CATEGORY_COLORS.slice(0, MIN_CATEGORIES).map((color, i) => ({
        gameId,
        color,
        sortOrder: i,
      })),
    ),
  ])
  return token
}

export async function updateGameMeta(gameId: string, input: GameMetaInput) {
  await getDb()
    .update(games)
    .set({ title: input.title })
    .where(eq(games.id, gameId))
}

export async function addCategory(gameId: string) {
  const db = getDb()
  const existing = await db
    .select({ color: categories.color, sortOrder: categories.sortOrder })
    .from(categories)
    .where(eq(categories.gameId, gameId))
  if (existing.length >= MAX_CATEGORIES) throw new EditFailure('LIMIT_REACHED')
  const used = new Set(existing.map(c => c.color))
  const color = CATEGORY_COLORS.find(c => !used.has(c))
  if (!color) throw new EditFailure('LIMIT_REACHED')
  const sortOrder = Math.max(-1, ...existing.map(c => c.sortOrder)) + 1
  await db.insert(categories).values({ gameId, color, sortOrder })
}

async function getCategory(gameId: string, categoryId: string) {
  const [row] = await getDb()
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.gameId, gameId)))
    .limit(1)
  if (!row) throw new EditFailure('NOT_FOUND')
  return row
}

export async function updateCategory(
  gameId: string,
  categoryId: string,
  input: CategoryUpdateInput,
) {
  await getCategory(gameId, categoryId)
  const db = getDb()
  const [taken] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.gameId, gameId),
        eq(categories.color, input.color),
        ne(categories.id, categoryId),
      ),
    )
    .limit(1)
  if (taken) throw new EditFailure('COLOR_TAKEN')
  await db
    .update(categories)
    .set({ name: input.name, color: input.color })
    .where(eq(categories.id, categoryId))
}

/** Sets or clears the image; returns the previous URL so it can be deleted. */
export async function setCategoryImage(
  gameId: string,
  categoryId: string,
  imageUrl: string | null,
): Promise<string | null> {
  const previous = (await getCategory(gameId, categoryId)).imageUrl
  await getDb()
    .update(categories)
    .set({ imageUrl })
    .where(eq(categories.id, categoryId))
  return previous
}

/** Deletes a category (and its questions); returns its image URL, if any. */
export async function deleteCategory(
  gameId: string,
  categoryId: string,
): Promise<string | null> {
  const row = await getCategory(gameId, categoryId)
  const db = getDb()
  const [total] = await db
    .select({ n: count() })
    .from(categories)
    .where(eq(categories.gameId, gameId))
  if ((total?.n ?? 0) <= MIN_CATEGORIES) throw new EditFailure('MIN_CATEGORIES')
  await db.delete(categories).where(eq(categories.id, categoryId))
  return row.imageUrl
}

export async function createQuestion(
  gameId: string,
  categoryId: string,
  input: QuestionInput,
) {
  await getCategory(gameId, categoryId)
  const db = getDb()
  const [total] = await db
    .select({ n: count() })
    .from(questions)
    .where(eq(questions.categoryId, categoryId))
  if ((total?.n ?? 0) >= MAX_QUESTIONS_PER_CATEGORY) {
    throw new EditFailure('LIMIT_REACHED')
  }
  await db.insert(questions).values({ categoryId, ...input })
}

async function getQuestion(gameId: string, questionId: string) {
  const [row] = await getDb()
    .select({ id: questions.id })
    .from(questions)
    .innerJoin(categories, eq(questions.categoryId, categories.id))
    .where(and(eq(questions.id, questionId), eq(categories.gameId, gameId)))
    .limit(1)
  if (!row) throw new EditFailure('NOT_FOUND')
  return row
}

export async function updateQuestion(
  gameId: string,
  questionId: string,
  input: QuestionInput,
) {
  await getQuestion(gameId, questionId)
  await getDb().update(questions).set(input).where(eq(questions.id, questionId))
}

export async function deleteQuestion(gameId: string, questionId: string) {
  await getQuestion(gameId, questionId)
  await getDb().delete(questions).where(eq(questions.id, questionId))
}

export type PublishResult =
  { ok: true; game: EditorGame } | { ok: false; issues: PublishIssue[] }

export async function publishGame(gameId: string): Promise<PublishResult> {
  const game = await getEditorGame(gameId)
  if (!game) throw new EditFailure('NOT_FOUND')
  const issues = publishIssues(game)
  if (issues.length > 0) return { ok: false, issues }
  // The slug is fixed on first publish so shared links never break.
  const slug = isDraftSlug(game.slug) ? publicSlug(game.title) : game.slug
  await getDb()
    .update(games)
    .set({ published: true, slug, updatedAt: new Date() })
    .where(eq(games.id, gameId))
  const updated = await getEditorGame(gameId)
  if (!updated) throw new EditFailure('NOT_FOUND')
  return { ok: true, game: updated }
}

/**
 * Bumps updated_at and, if an edit broke the publish requirements of a
 * published game, takes it back to draft so nobody plays a broken game.
 */
export async function afterEdit(gameId: string): Promise<EditorGame> {
  const game = await getEditorGame(gameId)
  if (!game) throw new EditFailure('NOT_FOUND')
  const unpublish = game.published && publishIssues(game).length > 0
  await getDb()
    .update(games)
    .set({ updatedAt: new Date(), ...(unpublish ? { published: false } : {}) })
    .where(eq(games.id, gameId))
  return unpublish ? { ...game, published: false } : game
}
