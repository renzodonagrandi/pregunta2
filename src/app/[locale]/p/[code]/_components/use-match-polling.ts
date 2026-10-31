'use client'

import { useEffect, useEffectEvent } from 'react'
import type { MatchView } from '@/features/online/types'

/** Fast at first, then slower while nothing happens (keeps Neon asleep). */
function delayFor(idleMs: number): number {
  if (idleMs < 2 * 60_000) return 3_000
  if (idleMs < 10 * 60_000) return 10_000
  return 30_000
}

/**
 * Asks the server whether the match moved past `version`. Only runs while
 * `enabled` (it's not the viewer's turn) and the tab is visible; checks right
 * away when the tab becomes visible again.
 */
export function useMatchPolling({
  code,
  version,
  enabled,
  onUpdate,
}: {
  code: string
  version: number
  enabled: boolean
  onUpdate: (view: MatchView) => void
}) {
  const handleUpdate = useEffectEvent(onUpdate)

  useEffect(() => {
    if (!enabled) return
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const startedAt = Date.now()

    const tick = async () => {
      if (stopped) return
      if (document.visibilityState === 'visible') {
        try {
          const res = await fetch(`/api/matches/${code}?v=${version}`, {
            cache: 'no-store',
          })
          if (res.ok) {
            const data = (await res.json()) as
              { changed: false } | { changed: true; view: MatchView }
            if (data.changed && !stopped) {
              handleUpdate(data.view)
              return // the new version restarts polling
            }
          }
        } catch {
          // Offline or a blip: try again on the next tick.
        }
      }
      if (!stopped) timer = setTimeout(tick, delayFor(Date.now() - startedAt))
    }

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      clearTimeout(timer)
      void tick()
    }

    timer = setTimeout(tick, delayFor(0))
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stopped = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [code, version, enabled])
}
