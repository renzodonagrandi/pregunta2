import { z } from 'zod'
import {
  MAX_CATEGORY_NAME_LENGTH,
  MAX_OPTION_LENGTH,
  MAX_QUESTION_LENGTH,
  MAX_TITLE_LENGTH,
} from './constants'
import { CATEGORY_COLORS } from './palette'

// Shared by editor forms (client) and server actions (server).

export const editTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, 'INVALID_TOKEN')

export const idSchema = z.uuid()

export const gameMetaSchema = z.object({
  title: z.string().trim().max(MAX_TITLE_LENGTH),
})

export const categoryUpdateSchema = z.object({
  name: z.string().trim().max(MAX_CATEGORY_NAME_LENGTH),
  color: z.enum(CATEGORY_COLORS),
})

const optionSchema = z.string().trim().min(1).max(MAX_OPTION_LENGTH)

export const questionInputSchema = z
  .object({
    text: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
    options: z.tuple([optionSchema, optionSchema, optionSchema, optionSchema]),
    correctIndex: z.number().int().min(0).max(3),
  })
  .refine(q => new Set(q.options.map(o => o.toLocaleLowerCase())).size === 4, {
    message: 'DUPLICATE_OPTIONS',
    path: ['options'],
  })

export type GameMetaInput = z.infer<typeof gameMetaSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
export type QuestionInput = z.infer<typeof questionInputSchema>

export const uploadPayloadSchema = z.object({
  token: editTokenSchema,
  categoryId: idSchema,
})

/** Blob pathname for a category image; the server only signs this exact path. */
export function categoryImagePathname(gameId: string, categoryId: string) {
  return `categories/${gameId}/${categoryId}.webp`
}
