import { getTranslations } from 'next-intl/server'
import { listMyMatches } from '@/features/online/queries'
import { readAllPlayerTokens } from '@/features/online/session'
import type { MatchSummary } from '@/features/online/types'
import { Link } from '@/i18n/navigation'

/**
 * Online matches this browser plays in (from its per-match cookies). Renders
 * nothing for people who never played online.
 */
export async function MyMatches() {
  const tokens = await readAllPlayerTokens()
  if (tokens.size === 0) return null
  const [t, matches] = await Promise.all([
    getTranslations('Online.home'),
    listMyMatches(tokens),
  ])
  if (matches.length === 0) return null

  const label = (m: MatchSummary) => {
    if (m.status === 'waiting') return t('waiting')
    if (m.status === 'finished') return t('finished')
    return m.myTurn
      ? t('yourTurn')
      : t('theirTurn', { name: m.rivalName ?? '' })
  }

  return (
    <section className='flex flex-col gap-2'>
      <h2 className='font-display text-2xl font-semibold'>{t('title')}</h2>
      <ul className='flex flex-col'>
        {matches.map(m => (
          <li key={m.code} className='border-b border-night-700'>
            <Link
              href={`/p/${m.code}`}
              aria-label={t('open', { title: m.title })}
              className='-mx-3 flex items-center gap-4 rounded-lg px-3 py-4 transition-colors hover:bg-night-800'
            >
              <span className='flex min-w-0 flex-1 flex-col gap-1'>
                <span className='truncate font-display text-lg font-semibold'>
                  {m.title}
                </span>
                {m.rivalName && (
                  <span className='truncate text-sm text-mist'>
                    {t('versus', { name: m.rivalName })}
                  </span>
                )}
              </span>
              <span
                className={`shrink-0 rounded-full px-3 py-1 font-display text-sm font-semibold ${m.myTurn ? 'bg-amber text-night' : 'bg-night-800 text-mist'}`}
              >
                {label(m)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
