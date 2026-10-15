'use client'

import { useLocale, type Locale } from 'next-intl'
import { useSyncExternalStore } from 'react'
import { getPathname } from '@/i18n/navigation'

const noopSubscribe = () => () => {}

/** window.location.origin on the client, '' during SSR (no mismatch). */
function useOrigin(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => '',
  )
}

/** Public play link; uses the game's locale so it opens in its language. */
export function usePlayLink(slug: string, gameLocale: Locale): string {
  const origin = useOrigin()
  return `${origin}${getPathname({ href: `/j/${slug}`, locale: gameLocale })}`
}

export function useEditLink(token: string): string {
  const origin = useOrigin()
  const locale = useLocale()
  return `${origin}${getPathname({ href: `/edit/${token}`, locale })}`
}
