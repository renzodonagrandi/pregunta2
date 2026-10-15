'use server'

import { createGame } from '@/features/games/mutations'
import { redirect } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

/** Home "Create game": creates a draft and opens its secret edit link. */
export async function createGameAction() {
  const token = await createGame()
  redirect({ href: `/edit/${token}`, locale: routing.defaultLocale })
}
