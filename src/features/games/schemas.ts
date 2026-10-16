import * as z from 'zod/mini'
import {
  MAX_CATEGORY_NAME_LENGTH,
  MAX_OPTION_LENGTH,
  MAX_QUESTION_LENGTH,
  MAX_TITLE_LENGTH,
} from './constants'
import { CATEGORY_COLORS } from './palette'

// Shared by editor forms (client) and server actions (server). Uses zod/mini:
// same validation as classic Zod, but tree-shakable, so the editor bundle
// only carries the checks used here.

export const editTokenSchema = z
  .string()
  .check(z.regex(/^[A-Za-z0-9_-]{43}$/, 'INVALID_TOKEN'))

export const idSchema = z.uuid()

export const gameMetaSchema = z.object({
  title: z.string().check(z.trim(), z.maxLength(MAX_TITLE_LENGTH)),
})

export const categoryUpdateSchema = z.object({
  name: z.string().check(z.trim(), z.maxLength(MAX_CATEGORY_NAME_LENGTH)),
  color: z.enum(CATEGORY_COLORS),
})

const optionSchema = z
  .string()
  .check(z.trim(), z.minLength(1), z.maxLength(MAX_OPTION_LENGTH))

export const questionInputSchema = z
  .object({
    text: z
      .string()
      .check(z.trim(), z.minLength(1), z.maxLength(MAX_QUESTION_LENGTH)),
    // Checked against the game's Blob prefix by the server action.
    imageUrl: z._default(z.nullable(z.url()), null),
    options: z.tuple([optionSchema, optionSchema, optionSchema, optionSchema]),
    correctIndex: z.int().check(z.minimum(0), z.maximum(3)),
  })
  .check(
    z.refine(
      q => new Set(q.options.map(o => o.toLocaleLowerCase())).size === 4,
      { message: 'DUPLICATE_OPTIONS', path: ['options'] },
    ),
  )

export type GameMetaInput = z.infer<typeof gameMetaSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
export type QuestionInput = z.infer<typeof questionInputSchema>

export const uploadPayloadSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('category'),
    token: editTokenSchema,
    categoryId: idSchema,
  }),
  z.object({ kind: z.literal('question'), token: editTokenSchema }),
])

export type UploadPayload = z.infer<typeof uploadPayloadSchema>

/** Blob pathname for a category image; the server only signs this exact path. */
export function categoryImagePathname(gameId: string, categoryId: string) {
  return `categories/${gameId}/${categoryId}.webp`
}

/**
 * Blob pathname for a question image. New questions have no id yet, so the
 * path is per game; Blob's random suffix makes every upload unique.
 */
export function questionImagePathname(gameId: string) {
  return `questions/${gameId}/image.webp`
}
