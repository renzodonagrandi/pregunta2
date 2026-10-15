import { useTranslations } from 'next-intl'
import { CategoryAvatar } from '@/components/category-avatar'
import {
  hasCategory,
  STREAK_TARGET,
  type GameState,
  type PlayerIndex,
} from '@/features/match/engine'

/** Both players' categories, whose turn it is, and the current streak. */
export function Scoreboard({ state }: { state: GameState }) {
  const t = useTranslations('Match.scoreboard')
  const indexes: PlayerIndex[] = [0, 1]
  const finished = state.phase.name === 'FINISHED'

  return (
    <section className='flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm'>
      {indexes.map(index => {
        const player = state.players[index]
        const active = !finished && state.current === index
        return (
          <div
            key={index}
            className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${active ? 'bg-amber-50 ring-2 ring-amber-400' : ''}`}
          >
            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='flex items-center gap-2 text-sm font-semibold'>
                <span className='truncate'>{player.name}</span>
                {active && (
                  <span className='rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-950 uppercase'>
                    {t('turn')}
                  </span>
                )}
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
            <ul className='flex shrink-0 gap-1'>
              {state.game.categories.map(c => {
                const owned = hasCategory(player, c.id)
                return (
                  <li key={c.id}>
                    <CategoryAvatar
                      name={c.name}
                      color={c.color}
                      imageUrl={c.imageUrl}
                      size={28}
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

function StreakBar({ count, label }: { count: number; label: string }) {
  return (
    <div className='mt-1 flex items-center gap-1' role='img' aria-label={label}>
      {Array.from({ length: STREAK_TARGET }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-8 rounded-full transition-colors ${i < count ? 'bg-emerald-500' : 'bg-zinc-200'}`}
        />
      ))}
    </div>
  )
}
