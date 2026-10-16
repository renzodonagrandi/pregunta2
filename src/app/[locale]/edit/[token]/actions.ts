'use server'

import { updateTag } from 'next/cache'
import { z } from 'zod'
import {
  deleteImagesQuietly,
  isCategoryImageUrl,
  isQuestionImageUrl,
} from '@/features/games/images'
import {
  addCategory,
  afterEdit,
  createQuestion,
  deleteCategory,
  deleteQuestion,
  isQuestionImageInUse,
  EditFailure,
  publishGame,
  setCategoryImage,
  updateCategory,
  updateGameMeta,
  updateQuestion,
  type EditError,
} from '@/features/games/mutations'
import {
  findGameByToken,
  gameTag,
  PUBLISHED_GAMES_TAG,
} from '@/features/games/queries'
import type { PublishIssue } from '@/features/games/requirements'
import {
  categoryUpdateSchema,
  editTokenSchema,
  gameMetaSchema,
  idSchema,
  questionInputSchema,
} from '@/features/games/schemas'
import type { EditorGame } from '@/features/games/types'

export type EditorActionError = EditError | 'INVALID_TOKEN' | 'INVALID_INPUT'

export type EditorActionResult =
  { ok: true; game: EditorGame } | { ok: false; error: EditorActionError }

/**
 * Every editor action is a public POST endpoint: validate the token (the only
 * authorization), validate the input, run the edit, refresh caches.
 */
async function edit(
  token: unknown,
  run: (gameId: string) => Promise<void>,
): Promise<EditorActionResult> {
  const parsedToken = editTokenSchema.safeParse(token)
  if (!parsedToken.success) return { ok: false, error: 'INVALID_TOKEN' }
  const row = await findGameByToken(parsedToken.data)
  if (!row) return { ok: false, error: 'INVALID_TOKEN' }
  try {
    await run(row.id)
  } catch (error) {
    if (error instanceof EditFailure) return { ok: false, error: error.code }
    if (error instanceof z.ZodError)
      return { ok: false, error: 'INVALID_INPUT' }
    throw error
  }
  const game = await afterEdit(row.id)
  invalidate(row.id, row.slug)
  return { ok: true, game }
}

function invalidate(gameId: string, slug: string) {
  updateTag(gameTag(gameId))
  updateTag(`game-slug:${slug}`)
  updateTag(PUBLISHED_GAMES_TAG)
}

export async function updateGameMetaAction(token: string, input: unknown) {
  return edit(token, id => updateGameMeta(id, gameMetaSchema.parse(input)))
}

export async function addCategoryAction(token: string) {
  return edit(token, id => addCategory(id))
}

export async function updateCategoryAction(
  token: string,
  categoryId: string,
  input: unknown,
) {
  return edit(token, id =>
    updateCategory(
      id,
      idSchema.parse(categoryId),
      categoryUpdateSchema.parse(input),
    ),
  )
}

export async function setCategoryImageAction(
  token: string,
  categoryId: string,
  imageUrl: string | null,
) {
  return edit(token, async id => {
    const catId = idSchema.parse(categoryId)
    const url = z.string().nullable().parse(imageUrl)
    if (url !== null && !isCategoryImageUrl(url, id, catId)) {
      throw new EditFailure('INVALID_IMAGE')
    }
    const previous = await setCategoryImage(id, catId, url)
    if (previous && previous !== url) await deleteImagesQuietly([previous])
  })
}

export async function deleteCategoryAction(token: string, categoryId: string) {
  return edit(token, async id => {
    const images = await deleteCategory(id, idSchema.parse(categoryId))
    await deleteImagesQuietly(images)
  })
}

function parseQuestion(gameId: string, input: unknown) {
  const question = questionInputSchema.parse(input)
  if (question.imageUrl && !isQuestionImageUrl(question.imageUrl, gameId)) {
    throw new EditFailure('INVALID_IMAGE')
  }
  return question
}

export async function createQuestionAction(
  token: string,
  categoryId: string,
  input: unknown,
) {
  return edit(token, id =>
    createQuestion(id, idSchema.parse(categoryId), parseQuestion(id, input)),
  )
}

export async function updateQuestionAction(
  token: string,
  questionId: string,
  input: unknown,
) {
  return edit(token, async id => {
    const question = parseQuestion(id, input)
    const previous = await updateQuestion(
      id,
      idSchema.parse(questionId),
      question,
    )
    if (previous && previous !== question.imageUrl) {
      await deleteImagesQuietly([previous])
    }
  })
}

export async function deleteQuestionAction(token: string, questionId: string) {
  return edit(token, async id => {
    const image = await deleteQuestion(id, idSchema.parse(questionId))
    await deleteImagesQuietly([image])
  })
}

/**
 * Removes an image uploaded in the question form that ended up unused
 * (form cancelled, or replaced before saving). Images still referenced by a
 * question are never deleted.
 */
export async function discardQuestionImageAction(token: string, url: string) {
  return edit(token, async id => {
    if (!isQuestionImageUrl(url, id)) throw new EditFailure('INVALID_IMAGE')
    if (!(await isQuestionImageInUse(url))) await deleteImagesQuietly([url])
  })
}

export type PublishActionResult =
  | { ok: true; game: EditorGame }
  | { ok: false; error: 'NOT_READY'; issues: PublishIssue[] }
  | { ok: false; error: EditorActionError }

export async function publishAction(
  token: string,
): Promise<PublishActionResult> {
  const parsedToken = editTokenSchema.safeParse(token)
  if (!parsedToken.success) return { ok: false, error: 'INVALID_TOKEN' }
  const row = await findGameByToken(parsedToken.data)
  if (!row) return { ok: false, error: 'INVALID_TOKEN' }
  const result = await publishGame(row.id)
  if (!result.ok)
    return { ok: false, error: 'NOT_READY', issues: result.issues }
  invalidate(row.id, row.slug)
  updateTag(`game-slug:${result.game.slug}`)
  return { ok: true, game: result.game }
}
