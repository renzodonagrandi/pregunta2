'use server'

import { after } from 'next/server'
import { createMatch, deleteStaleMatches } from '@/features/online/mutations'
import { playerNameSchema, slugSchema } from '@/features/online/schemas'
import { savePlayerToken } from '@/features/online/session'
import { redirect } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

export type CreateMatchResult = {
  ok: false
  error: 'INVALID_NAME' | 'GAME_NOT_FOUND'
}

/** "Jugar online": creates the match, keeps the player's token, opens it. */
export async function createMatchAction(
  slug: string,
  name: string,
): Promise<CreateMatchResult> {
  const parsedSlug = slugSchema.safeParse(slug)
  const parsedName = playerNameSchema.safeParse(name)
  if (!parsedName.success) return { ok: false, error: 'INVALID_NAME' }
  if (!parsedSlug.success) return { ok: false, error: 'GAME_NOT_FOUND' }
  const result = await createMatch(parsedSlug.data, parsedName.data)
  if (!result.ok) return { ok: false, error: 'GAME_NOT_FOUND' }
  await savePlayerToken(result.value.code, result.value.token)
  // Housekeeping the creator doesn't need to wait for.
  after(deleteStaleMatches)
  return redirect({
    href: `/p/${result.value.code}`,
    locale: routing.defaultLocale,
  })
}
