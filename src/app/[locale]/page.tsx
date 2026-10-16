import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { Logo } from '@/components/brand/logo'
import { createGameAction } from './actions'
import { CreateGameButton } from './_components/create-game-button'
import {
  PublishedGames,
  PublishedGamesSkeleton,
} from './_components/published-games'

export default async function HomePage() {
  const [t, tc, { Home }] = await Promise.all([
    getTranslations('Home'),
    getTranslations('Common'),
    getMessages(),
  ])

  return (
    <main className='mx-auto grid w-full max-w-6xl flex-1 content-start gap-14 px-5 pt-14 pb-16 lg:grid-cols-[1.15fr_1fr] lg:content-center lg:gap-24 lg:px-8 lg:py-20'>
      <section className='flex flex-col items-start gap-6'>
        <h1 className='w-full max-w-sm text-chalk sm:max-w-md lg:max-w-xl'>
          <Logo label={tc('appName')} className='h-auto w-full' />
        </h1>
        <p className='max-w-md text-xl leading-relaxed text-chalk/85 lg:text-2xl lg:leading-snug'>
          {t('subtitle', { categories: tc('categories') })}
        </p>
        <form action={createGameAction} className='w-full sm:w-auto'>
          <NextIntlClientProvider messages={{ Home }}>
            <CreateGameButton />
          </NextIntlClientProvider>
        </form>
        <p className='max-w-sm text-sm leading-relaxed text-mist'>
          {t('createHint')}
        </p>
      </section>

      <section className='flex flex-col gap-2'>
        <h2 className='font-display text-2xl font-semibold'>
          {t('published')}
        </h2>
        <Suspense fallback={<PublishedGamesSkeleton />}>
          <PublishedGames />
        </Suspense>
      </section>
    </main>
  )
}
