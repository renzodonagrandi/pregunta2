'use server'

import { z } from 'zod'
import { createGame } from '@/features/games/mutations'
import { redirect } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

/** Home "Create game": creates a draft and opens its secret edit link. */
export async function createGameAction(formData: FormData) {
  const locale = z
    .enum(routing.locales)
    .catch(routing.defaultLocale)
    .parse(formData.get('locale'))
  const token = await createGame(locale)
  redirect({ href: `/edit/${token}`, locale })
}
