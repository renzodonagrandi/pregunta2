import { getTranslations } from 'next-intl/server'
import { locale as rootLocale } from 'next/root-params'
import { Suspense } from 'react'
import { createGameAction } from './actions'
import { CreateGameButton } from './_components/create-game-button'
import {
  PublishedGames,
  PublishedGamesSkeleton,
} from './_components/published-games'

export default async function HomePage() {
  const [t, tc, locale] = await Promise.all([
    getTranslations('Home'),
    getTranslations('Common'),
    rootLocale(),
  ])

  return (
    <main className='mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-10'>
      <section className='flex flex-col items-center gap-3 text-center'>
        <h1 className='text-5xl font-extrabold tracking-tight'>{t('title')}</h1>
        <p className='text-lg text-zinc-600'>
          {t('subtitle', { categories: tc('categories') })}
        </p>
        <form action={createGameAction} className='mt-2 w-full'>
          <input type='hidden' name='locale' value={locale} />
          <CreateGameButton />
        </form>
        <p className='text-sm text-zinc-500'>{t('createHint')}</p>
      </section>

      <section className='flex flex-col gap-3'>
        <h2 className='text-xl font-bold'>{t('published')}</h2>
        <Suspense fallback={<PublishedGamesSkeleton />}>
          <PublishedGames />
        </Suspense>
      </section>
    </main>
  )
}
