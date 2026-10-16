import { getTranslations } from 'next-intl/server'
import { connection } from 'next/server'
import { listPublishedGames } from '@/features/games/queries'
import { Link } from '@/i18n/navigation'

export async function PublishedGames() {
  // Rendered per request (from the tagged cache), so builds never need the DB.
  await connection()
  const [t, games] = await Promise.all([
    getTranslations('Home'),
    listPublishedGames(),
  ])

  if (games.length === 0) {
    return <p className='py-6 text-mist'>{t('empty')}</p>
  }

  // A fixtures board: plain rows, colors only (no image requests on the home).
  return (
    <ul className='flex flex-col'>
      {games.map(game => (
        <li key={game.slug} className='border-b border-night-700'>
          <Link
            href={`/j/${game.slug}`}
            aria-label={t('play', { title: game.title })}
            className='group -mx-3 flex items-center gap-4 rounded-lg px-3 py-4 transition-colors hover:bg-night-800'
          >
            <span className='flex min-w-0 flex-1 flex-col gap-1.5'>
              <span className='truncate font-display text-lg font-semibold'>
                {game.title}
              </span>
              <span className='flex items-center gap-2 text-sm text-mist'>
                <span className='flex gap-1' aria-hidden>
                  {game.categories.map(c => (
                    <span
                      key={c.id}
                      className='size-3 rounded-full'
                      style={{ backgroundColor: c.color }}
                    />
                  ))}
                </span>
                {t('categoriesCount', { count: game.categories.length })}
              </span>
            </span>
            <svg
              viewBox='0 0 24 24'
              aria-hidden
              className='size-5 shrink-0 text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-amber'
            >
              <path
                d='M9 5l7 7-7 7'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinejoin='round'
              />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function PublishedGamesSkeleton() {
  return (
    <ul className='flex animate-pulse flex-col' aria-busy>
      {[0, 1, 2].map(i => (
        <li key={i} className='border-b border-night-700 py-4'>
          <div className='h-5 w-40 rounded bg-night-800' />
          <div className='mt-2.5 h-3 w-24 rounded bg-night-800' />
        </li>
      ))}
    </ul>
  )
}
