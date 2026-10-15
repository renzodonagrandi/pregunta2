'use client'

import { useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/** window.location.origin on the client, '' during SSR (no mismatch). */
function useOrigin(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => '',
  )
}

export function usePlayLink(slug: string): string {
  return `${useOrigin()}/j/${slug}`
}

export function useEditLink(token: string): string {
  return `${useOrigin()}/edit/${token}`
}
