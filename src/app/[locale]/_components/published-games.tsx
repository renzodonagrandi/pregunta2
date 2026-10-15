import { getTranslations } from 'next-intl/server'
import { connection } from 'next/server'
import { CategoryAvatar } from '@/components/category-avatar'
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
    return (
      <p className='rounded-2xl bg-white p-6 text-center text-zinc-500 shadow-sm'>
        {t('empty')}
      </p>
    )
  }

  return (
    <ul className='flex flex-col gap-3'>
      {games.map(game => (
        <li key={game.slug}>
          <Link
            href={`/j/${game.slug}`}
            aria-label={t('play', { title: game.title })}
            className='flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 transition-colors hover:bg-zinc-50'
          >
            <span className='min-w-0 flex-1 truncate text-lg font-semibold'>
              {game.title}
            </span>
            <span className='flex shrink-0 gap-1'>
              {game.categories.map(c => (
                <CategoryAvatar
                  key={c.id}
                  name={c.name}
                  color={c.color}
                  imageUrl={c.imageUrl}
                  size={28}
                />
              ))}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function PublishedGamesSkeleton() {
  return (
    <ul className='flex animate-pulse flex-col gap-3' aria-busy>
      {[0, 1, 2].map(i => (
        <li key={i} className='h-[68px] rounded-2xl bg-zinc-200' />
      ))}
    </ul>
  )
}
