import { useTranslations } from 'next-intl'
import { CategoryAvatar } from '@/components/category-avatar'
import {
  hasCategory,
  STREAK_TARGET,
  type GameState,
  type PlayerIndex,
} from '@/features/match/engine'

/** Both players' categories, whose turn it is, and the current streak. */
export function Scoreboard({
  state,
  you,
  youLabel,
}: {
  state: GameState
  /** Online play: marks the viewer's row. */
  you?: PlayerIndex | undefined
  youLabel?: string | undefined
}) {
  const t = useTranslations('Match.scoreboard')
  const indexes: PlayerIndex[] = [0, 1]
  const finished = state.phase.name === 'FINISHED'

  return (
    <section className='relative z-10 flex flex-col gap-1 rounded-2xl bg-night-800/95 p-1.5'>
      {indexes.map(index => {
        const player = state.players[index]
        const active = !finished && state.current === index
        return (
          <div
            key={index}
            className={`relative flex min-h-12 items-center gap-3 rounded-xl py-2 pr-2 pl-4 ${active ? 'bg-night-700/70' : ''}`}
          >
            {active && (
              <span
                className='absolute top-2 bottom-2 left-1.5 w-1 rounded-full bg-amber'
                aria-hidden
              />
            )}
            <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
              <span
                className={`truncate font-display text-base font-semibold ${active ? 'text-chalk' : 'text-mist'}`}
              >
                {player.name}
                {you === index && youLabel && (
                  <span className='ml-1.5 text-xs font-medium text-mist'>
                    ({youLabel})
                  </span>
                )}
                {active && <span className='sr-only'> · {t('turn')}</span>}
              </span>
              {active && (
                <StreakBar
                  count={player.streak}
                  label={t('streak', {
                    count: player.streak,
                    total: STREAK_TARGET,
                  })}
                />
              )}
            </div>
            <ul className='flex shrink-0 gap-1.5'>
              {state.game.categories.map(c => {
                const owned = hasCategory(player, c.id)
                return (
                  <li key={c.id}>
                    <CategoryAvatar
                      name={c.name}
                      color={c.color}
                      imageUrl={c.imageUrl}
                      size={26}
                      muted={!owned}
                    />
                    <span className='sr-only'>
                      {owned
                        ? t('owned', { name: c.name })
                        : t('missing', { name: c.name })}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </section>
  )
}

/** Three thick strokes, cut like the logo's letters. */
function StreakBar({ count, label }: { count: number; label: string }) {
  return (
    <div className='flex items-center gap-1' role='img' aria-label={label}>
      {Array.from({ length: STREAK_TARGET }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 w-7 transition-colors duration-300 ${i < count ? 'bg-amber' : 'bg-night-600'}`}
        />
      ))}
    </div>
  )
}
